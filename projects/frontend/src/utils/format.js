export const formattedMoney = (number) =>
     "RD"+new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(number);