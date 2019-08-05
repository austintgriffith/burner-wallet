import React from 'react';
import cn from 'classnames/bind';
import style from '../index.scss';

const cx = cn.bind(style);

const TableHeader = () => {
  return (
    <thead>
      <tr>
        <th className={cx('tableHeading', 'first')} />
        <th className={cx('tableHeading')}>Order Type</th>
        <th className={cx('tableHeading')}>Outcome</th>
        <th className={cx('tableHeading')}>Outcome token count</th>
        <th className={cx('tableHeading')}>Avg. Price</th>
        <th className={cx('tableHeading')}>Date</th>
        <th className={cx('tableHeading')}>Cost</th>
      </tr>
    </thead>
  );
};

export default TableHeader;
