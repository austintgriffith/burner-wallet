// @format
import React, { Component } from "react";
import { time } from "../services/ethgasstation";
import getConfig from "../config";

let interval;
const CONFIG = getConfig();
const RATE = {
  PERCENT: 3,
  EACH: 250
};

class Loader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      progress: 0,
      rate: {
        percent: RATE.PERCENT,
        each: RATE.EACH
      }
    };

    this.progress = this.progress.bind(this);
  }

  async componentDidMount() {
    const { network } = this.props;

    let t;
    if (network === "ROOTCHAIN") {
      t = await time();
    } else if (network === "SIDECHAIN") {
      t = CONFIG.SIDECHAIN.TIME_ESTIMATES.TX; //ms
      throw new Error("Network not yet supported");
    } else {
      // 8ms was Loader's default value.
      t = 8333; // ms
    }

    const rate = {
      // NOTE: We "round" the result of "each"'s calculation
      each: parseInt(t / 100 / RATE.PERCENT, 10),
      percent: RATE.PERCENT
    };
    this.setState({ rate }, () => {
      interval = setInterval(this.progress, rate.each);
    });
  }

  componentWillUnmount() {
    clearInterval(interval);
  }

  progress() {
    const { rate, progress } = this.state;

    let newProgress = progress + rate.percent;
    if (newProgress > 100) {
      newProgress = 100;
      clearInterval(interval);
    }
    this.setState({ progress: newProgress });
  }

  render() {
    const { progress } = this.state;
    const { loaderImage } = this.props;

    return (
      <div className="loader">
        <img
          alt="Burner Wallet Logo"
          src={loaderImage}
          className="loader__logo"
        />
        <div className="loader__progress">
          <div
            className="loader__progress_fill"
            style={{ width: progress + "%" }}
          />
        </div>
      </div>
    );
  }
}
export default Loader;
