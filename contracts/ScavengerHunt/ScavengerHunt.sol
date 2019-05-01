pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

contract ScavengerHunt {
  using SafeMath for uint;
  using ECDSA for bytes32;

  struct Answer {
    bytes32 commit; // hashed answer
    bytes32 reveal; // answer unhashed
    bool revealed;
    bool correct;
  }

  struct Player {
      Answer[] answers;
      uint timestamp;     // timestamp of latest commit used for tiebreaker
      uint score;
  }

  // This declares a state variable that
  // stores a `Player` struct for each possible address.
  mapping(address => Player) public players;

  address[] public playerList;

  // Array of answers
  bytes32[] public answers;
  bytes32[] public revealedAnswers;
  uint public gameEndTime;      // Time in seconds, game ends
  uint public revealEndTime;    // Time in seconds, after end game to reveal answers

  modifier onlyBefore(uint _time) { require(now < _time); _; }
  modifier onlyAfter(uint _time) { require(now > _time); _; }
  modifier onlyStatus(bytes32 _status) { require(compareStrings(status, _status)); _; }
  modifier onlyOwner() { require(owner == msg.sender); _; }

  string public YourVar = "MY WORLD";
  address public owner;
  address public winner;
  bytes32 public status = 'Start';

  /// @dev contructor
  /// @param _answers array of hashed answers
  /// @param _gameEndTime number of seconds to end game after contract creation
  /// @param _revealEndTime number of seconds for player to reveal after game ends
  constructor(bytes32[] _answers, uint _gameEndTime, uint _revealEndTime) public payable {
    answers = _answers;
    gameEndTime = now + _gameEndTime;
    revealEndTime = gameEndTime + _revealEndTime;
    owner = msg.sender;
  }

  function updateVar(string newVal) public returns (bool) {
    require(msg.sender==owner,"ScavengerHunt::updateVar not owner");
    YourVar=newVal;
    return true;
  }

  /// @dev commits users answer to a question and joins player in game if not already joined
  /// @param _hashedAnswer is hashed answered using a salt
  /// @param _questionIndex is index to question being answered
  function commitAnswer(bytes32 _hashedAnswer, uint _questionIndex) public onlyBefore(gameEndTime) {
    Player storage player = players[msg.sender];

    // Add player if hasn't joined yet
    if (player.answers.length == 0) {
      playerList.push(msg.sender);
      for (uint i = 0; i < answers.length; i++) {
        Answer memory a;
        player.answers.push(a);
      }
    }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
    // Can only commit answer once
    require(player.answers[_questionIndex].commit == 0, "ScavengerHunt::answer committed already");

    // Store player answer to correct question
    player.answers[_questionIndex].commit = _hashedAnswer;
    player.timestamp = now;
  }

  /// @dev ends game and provides answer. Sets game in reveal phase for players to reveal answers
  /// @param _answers array of answers
  /// @param _salt salt used to hash initial answers in constructor
  function endGame(bytes32[] _answers, bytes32 _salt) public onlyOwner() onlyAfter(gameEndTime) {
      // No players refund all money to owner
      uint length = playerList.length;
      uint answersLength = answers.length;
      if (length == 0) kill();
      
      // Check supplied answers correct
      for (uint idx = 0; idx < answersLength; idx++) {
        require(getSaltedHash(_answers[idx], _salt) == answers[idx], "ScavengerHunt::endGame: Answers don't match");
        revealedAnswers.push(_answers[idx]);
      }

      status = 'Reveal';
  }

  /// @dev Finds winner and sends winner pot if exists, otherwise send back to owner
  function findWinner() onlyAfter(revealEndTime) public onlyStatus('Reveal') {
    // Loop Through all players and determine winner
    uint length = playerList.length;
    for (uint i = 0; i < length; i++) {
      // Initialize first winner
      if ((players[winner].timestamp == 0 && players[playerList[i]].score > 0)) {
        winner = playerList[i];
      }

      // Check if player has higher score
      if (players[playerList[i]].score > players[winner].score) {
        // Select player with higher score
        winner = playerList[i];
      } else if (players[playerList[i]].score == players[winner].score && players[playerList[i]].timestamp < players[winner].timestamp) {
        // Tie then select player with lower timestamp
        winner = playerList[i];
      }
    }

    status = 'Game Over';

    if (winner == 0) {
      owner.transfer(address(this).balance);
      emit NoWinner();
      return;
    }

    emit Winner(winner, address(this).balance);

    // Send pot to winner
    winner.transfer(address(this).balance);
  }
  event Winner(address winner, uint amount);
  event NoWinner();

  /// @dev reveal answer to a question
  /// @param _answer unhashed answer
  /// @param _questionIndex question being answered
  /// @param _salt salt used to hash answer
  /// @return true if correct answer
  function revealAnswer(bytes32 _answer, uint _questionIndex, bytes32 _salt) public onlyStatus('Reveal') onlyBefore(revealEndTime) returns (bool) {
    Answer storage answer = players[msg.sender].answers[_questionIndex];

    //make sure it hasn't been revealed yet and set it to revealed
    require(answer.revealed == false, "ScavengerHunt::revealAnswer: Already revealed");
    answer.revealed = true;
    //require that they can produce the committed hash
    require(getSaltedHash(_answer, _salt) == answer.commit, "ScavengerHunt::revealAnswer: Revealed hash does not match commit");
    answer.reveal = _answer;
    if (_answer == revealedAnswers[_questionIndex]) {
      players[msg.sender].score++;
      answer.correct = true;
    }

    emit RevealAnswer(msg.sender,_answer,_salt, answer.correct);
    return answer.correct;
  }
  event RevealAnswer(address sender, bytes32 answer, bytes32 salt, bool correct);

  /// @dev returns salted hash of some data
  /// @param _data data to be hashed
  /// @param _salt salt used to hash answer
  /// @return  hashed data
  function getSaltedHash(bytes32 _data, bytes32 _salt) public view returns(bytes32){
    return keccak256(abi.encodePacked(_data, _salt));
  }

  /// @dev returns true if strings same
  /// @param a string one 
  /// @param b string two 
  /// @return true/false
  function compareStrings(bytes32 a, bytes32 b) public pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }

  /// @dev kills contract and returns funds
  function kill() public onlyOwner() {
      selfdestruct(msg.sender);
  }
}