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
      <Badge key={"b"+b} id={badges[b].id} image={badges[b].image} selectBadge={selectBadge}/>
    )
  }

  return (
    <StackGrid
      gutterHeight={0}
      gutterWidth={10}
      columnWidth={60}
      style={{marginRight:20,marginTop:10,marginBottom:20}}
    >
      {allBadges}
    </StackGrid>
  )
};
