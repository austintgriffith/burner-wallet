import React from 'react';
import cn from 'classnames/bind';
import { schemeDark2 } from 'd3-scale-chromatic';
import { scaleOrdinal } from 'd3';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import { COLOR_SCHEME_DEFAULT } from '../../../../../utils/constants';
import style from '../index.scss';
import CustomTooltip from '../CustomTooltip';

import DateAxisTick from '../DateAxisTick';

const cx = cn.bind(style);

const percentageFormatter = (val) => (val * 100).toFixed(0);

const lineChartMargins = {
  top: 10,
  right: 0,
  left: 0,
  bottom: 0
};
const CategoricalGraph = ({ data }) => {
  const stacks = Object.keys(data[0]).filter(
    (key) => key !== 'date' && key !== 'scalarPoint'
  );
  const z = scaleOrdinal(schemeDark2);
  z.domain(stacks);
  return (
    <div className={cx('marketGraph')}>
      <div className={cx('marketGraphContainer')}>
        <ResponsiveContainer>
          <LineChart data={data} margin={lineChartMargins}>
            <defs>
              {stacks.map((key, keyIndex) => (
                <linearGradient
                  key={key}
                  id={`gradient_${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={z(keyIndex)} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={z(keyIndex)} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis
              className="axis axis--x"
              dataKey="date"
              tickSize={0}
              tick={DateAxisTick}
            />
            <YAxis
              className="axis axis--y"
              padding={{ bottom: 30 }}
              tickFormatter={percentageFormatter}
              domain={[0, 1]}
              unit="%"
              type="number"
            />
            <Tooltip className="tooltip" content={<CustomTooltip />} />
            <Legend />
            {stacks.map((key, keyIndex) => (
              <Line
                key={key}
                type="stepAfter"
                dataKey={key}
                stackId="1"
                fill={COLOR_SCHEME_DEFAULT[keyIndex]}
                stroke={COLOR_SCHEME_DEFAULT[keyIndex]}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoricalGraph;
