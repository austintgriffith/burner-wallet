import React from 'react';
import moment from 'moment';

const DateAxisTick = ({ x, y, payload }) => (
  <g transform={`translate(${x}, ${y})`}>
    <text x={0} y={0} dy={16} textAnchor="middle">
      {moment(payload.value).format('L')}
    </text>
  </g>
);

export default DateAxisTick;
