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
      uint timestamp;     // timestamp of latest commit used for tiebreaker
      uint score;
      Answer[] answers;
  }

  // This declares a state variable that
  // stores a `Player` struct for each possible address.
  mapping(address => Player) public players;

  address[] public playerList;

  // Array of answers
  bytes32[] public answers;
  bytes32[] public revealedAnswers;
  uint public gameEndTime;      // Time in seconds, game ends
  uint public revealEndTime = 1000000;    // Time in seconds, after end game to reveal answers, default large end time

  modifier onlyBefore(uint _time) {require(now < _time, "onlyBefore error"); _;}
  modifier onlyAfter(uint _time) {require(now > _time, "onlyAfter error"); _;}
  modifier onlyStatus(bytes32 _status) {require(compareStrings(status, _status), "onlyStatus error"); _;}
  modifier onlyOwner() {require(owner == msg.sender, "onlyOwner access"); _;}
  modifier onlyWinnerNotFound() {require(!winnerFound, "winner already found"); _;}

  string public YourVar = "MY WORLD";
  address public owner;
  address public winner;
  bytes32 public status = 'Start';
  bool public winnerFound = false;

  /// @dev contructor
  /// @param _answers array of hashed answers
  /// @param _gameEndTime number of seconds to end game after contract creation
  constructor(bytes32[] _answers, uint _gameEndTime) public payable {
    answers = _answers;
    gameEndTime = now + _gameEndTime;
    owner = msg.sender;
  }

  function() public payable {}

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

    emit CommitAnswer(msg.sender, _hashedAnswer, _questionIndex);
  }

  event CommitAnswer(address sender, bytes32 hashedAnswer, uint questionIndex);

  /// @dev ends game and provides answer. Sets game in reveal phase for players to reveal answers
  /// @param _answers array of answers
  /// @param _salt salt used to hash initial answers in constructor
  /// @param _revealEndTime number of seconds for player to reveal after game ends
  function endGame(bytes32[] _answers, bytes32 _salt, uint _revealEndTime) public onlyOwner() onlyAfter(gameEndTime) {
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
      revealEndTime = now + _revealEndTime;

      emit EndGame(revealEndTime);
  }

  event EndGame(uint revealEndTime);

  /// @dev Finds winner and sends winner pot if exists, otherwise send back to owner
  function findWinner() public onlyWinnerNotFound() onlyAfter(revealEndTime) onlyStatus('Reveal') {
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
      winnerFound = true;
      return;
    }

    emit Winner(winner, address(this).balance);

    winnerFound = true;
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
  function revealAnswer(bytes32 _answer, uint _questionIndex, bytes32 _salt)
    public onlyStatus('Reveal') onlyAfter(gameEndTime) onlyBefore(revealEndTime) returns (bool) {
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
  function getSaltedHash(bytes32 _data, bytes32 _salt) public pure returns(bytes32){
    return keccak256(abi.encodePacked(_data, _salt));
  }

  /// @dev returns true if strings same
  /// @param a string one
  /// @param b string two
  /// @return true/false
  function compareStrings(bytes32 a, bytes32 b) public pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }

  /// @dev return number of questions
  function getNumQuestions() public view returns(uint count) {
    return answers.length;
  }

  /// @dev return number of players
  function getNumPlayers() public view returns(uint count) {
    return playerList.length;
  }

  /// @dev return player data
  function getPlayerData(address _player) public view returns (uint, uint) {
    return (players[_player].timestamp, players[_player].score);
  }

  /// @dev return player data
  function getPlayerDataByIndex(uint index) public view returns (uint, uint) {
    return (players[playerList[index]].timestamp, players[playerList[index]].score);
  }

  /// @dev kills contract and returns funds
  function kill() public onlyOwner() {
      selfdestruct(msg.sender);
  }
}