import React from 'react';

import { pmService } from '../../../../services';
import Graph from '../../components/Graph';
import getMarketGraph from './utils/getGraph';

export default class GraphContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      marketGraph: []
    };
  }

  componentDidMount() {
    const { market } = this.props;
    pmService.getMarketTrades(market.address).then((trades) => {
      const marketGraph = getMarketGraph(market, trades);
      this.setState({ marketGraph });
    });
  }

  render() {
    const { onOverview, market } = this.props;
    const { marketGraph } = this.state;
    return <Graph onOverview={onOverview} data={marketGraph} market={market} />;
  }
}
