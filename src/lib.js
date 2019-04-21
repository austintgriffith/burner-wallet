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
