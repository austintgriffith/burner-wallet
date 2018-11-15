import React from 'react';

export default class SentToDisplay extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let sendToInput = this.props.sendToInput;

      return (
        <div>
          <div>send to address:</div>
          <input
              style={{verticalAlign:"middle",width:280,margin:6,maxHeight:20,padding:5,border:'2px solid #ccc',borderRadius:5}}
              type="text" name="sendToInput" value={sendToInput} onChange={this.props.handleInput}
          />
        </div>
      );
    }
}
