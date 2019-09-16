import React from "react";
import axios from "axios";

export default class CollectiblesModule extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      assets: [],
      loading: "Loading"
    };
  }

  componentWillMount() {
    axios
      .get(
        `https://api.opensea.io/api/v1/assets/?owner=${
          this.props.address
        }&order_by=current_price&order_direction=asc`
      )
      .then(response => {
        console.log("Data#### ", response.data.assets);
        this.setState({
          assets: response.data.assets
        });
      });
  }

  render() {
    return (
      <div>
        {this.state.assets.length <= 0 && <p>{this.state.loading}</p>}
        <div className="container w-100">
          <div className="row" style={{ width: "100%", textAlign: "center" }}>
            {this.state.assets.map(asset =>
              asset.image_url ? (
                <div className="col-4">
                  <div className="card">
                    <a href={asset.external_link}>
                      <img
                        className="img-fluid"
                        src={asset.image_url}
                        alt={asset.name}
                      />
                    </a>
                    <p>{asset.name}</p>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    );
  }
}
