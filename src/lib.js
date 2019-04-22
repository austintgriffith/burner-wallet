import { DOLLAR_SYMBOL } from './config';

let dollarConversion = 1.0
//let dollarSymbol = "€"
//let dollarConversion = 0.88
export const convertToDollar = (amount)=>{
  return (parseFloat(amount)/dollarConversion)
}

export const convertFromDollar = (amount)=>{
  return (parseFloat(amount)*dollarConversion)
}

export const dollarDisplay = (amount)=>{
  amount = Math.floor(amount*100)/100
  return DOLLAR_SYMBOL + convertFromDollar(amount).toFixed(2)
}

export const parseAndCleanPath = (path) => {
  const parts = path.split(";")

  const state = {}
  if(parts.length>0){
    state.toAddress = parts[0].replace("/","")
  }
  if(parts.length>=2){
    state.amount = parts[1]
  }
  if(parts.length>2){
    state.message = decodeURI(parts[2])
      .replaceAll("%23","#")
      .replaceAll("%3B",";")
      .replaceAll("%3A",":")
      .replaceAll("%2F","/")
  }
  if(parts.length>3){
    state.extraMessage = decodeURI(parts[3])
      .replaceAll("%23","#")
      .replaceAll("%3B",";")
      .replaceAll("%3A",":")
      .replaceAll("%2F","/")
  }
  return state;
}
