import React from 'react';
import Button from '../../../../ui-components/Button';
import cn from 'classnames/bind';

import ArrowRight from '@material-ui/icons/ArrowRight';
import { OUTCOME_TYPES } from '../../../../utils/constants';
import CategoricalGraph from './Categorical';
import ScalarGraph from './Scalar';
import style from './index.scss';

const cx = cn.bind(style);

const Graph = ({ onOverview, data, market: { type, bounds } }) => {
  let graph;
  if (data.length) {
    if (type === OUTCOME_TYPES.CATEGORICAL) {
      graph = <CategoricalGraph data={data} />;
    }
    if (type === OUTCOME_TYPES.SCALAR) {
      graph = <ScalarGraph data={data} bounds={bounds} />;
    }
  } else {
    graph = null;
  }
  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {graph}
      <div style={{ position: 'relative' }}>
        <Button size="small" onClick={onOverview} className={cx('back-button')}>
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
};

export default Graph;
