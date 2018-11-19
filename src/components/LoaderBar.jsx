import React from 'react';
import ReactLoading from 'react-loading';

export default class LoaderBar extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let loaderBar = "";

      if(this.props.sending){
        loaderBar = (
          <div style={{opacity:0.5,position:"absolute",top:"-20%",left:0,width:"100%"}}>
            <ReactLoading type={"cubes"} color={"#38a5d8"} width={"100%"} />
          </div>
        )
      }

      return loaderBar;
    }
}
