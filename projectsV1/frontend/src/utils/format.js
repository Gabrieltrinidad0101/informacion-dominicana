export const formattedMoney = (number) =>{
  if(!number) return "0.00"
  if(number.toLowerCase?.().includes('honor')) return "honorífico"
  return "RD"+new Intl.NumberFormat("en-US", {
   style: "currency",
   currency: "USD",
 }).format(number);
}