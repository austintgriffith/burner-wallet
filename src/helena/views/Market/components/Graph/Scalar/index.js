import React from 'react';
import cn from 'classnames/bind';
import { schemeDark2 } from 'd3-scale-chromatic';
import { scaleOrdinal } from 'd3';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Decimal from 'decimal.js';
import { COLOR_SCHEME_DEFAULT } from '../../../../../utils/constants';
import CustomTooltip from '../CustomTooltip';
import DateAxisTick from '../DateAxisTick';
import style from '../index.scss';

const cx = cn.bind(style);

const lineChartMargins = {
  top: 10,
  right: 0,
  left: 0,
  bottom: 0
};

const ScalarGraph = ({ data, bounds }) => {
  const stacks = [`Current ${bounds.unit}`];
  const z = scaleOrdinal(schemeDark2);
  const scalarTickFormatter = (val) => `${val} ${bounds.unit}`;
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
              tick={DateAxisTick}
              domain={[data[0].date, new Date().valueOf()]}
            />
            <YAxis
              className="axis axis--y"
              tickFormatter={scalarTickFormatter}
              padding={{ bottom: 30 }}
              domain={[
                Decimal(bounds.lower)
                  .div(10 ** bounds.decimals)
                  .toDP(bounds.decimals)
                  .toNumber(),
                Decimal(bounds.upper)
                  .div(10 ** bounds.decimals)
                  .toDP(bounds.decimals)
                  .toNumber()
              ]}
            />
            <CartesianGrid className="grid" vertical />
            <Tooltip
              className="tooltip"
              content={<CustomTooltip isScalar unit={bounds.unit} />}
            />
            <Line
              type="stepAfter"
              dataKey="scalarPoint"
              fill={COLOR_SCHEME_DEFAULT[2]}
              stroke={COLOR_SCHEME_DEFAULT[2]}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScalarGraph;
