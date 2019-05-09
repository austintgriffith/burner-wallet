import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";
import StackGrid from 'react-stack-grid'
import Badge from './Badge';
export  default ({badges,address,selectBadge}) => {


  let allBadges = []
  for(let b in badges){
    //console.log("badges",b,badges[b])
    //we have a url description... tons of other meta data if we want to do something else here....
    allBadges.push(
      <Badge
        key={"b"+b}
        badge={badges[b]}
        selectBadge={selectBadge}
        showName={true}
      />
    )
  }

  return (
    <StackGrid
      columnWidth={145}
      gutterHeight={15}
      gutterWidth={15}
      style={{marginTop:10,marginBottom:20}}
    >
      {allBadges}
    </StackGrid>
  )
};
