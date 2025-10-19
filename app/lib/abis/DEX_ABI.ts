export const DEX_ABI = [
  "function addLiquidity(uint8 pair, uint256 amount1, uint256 amount2)",
  "function swapExactInput(uint8 pair, address tokenIn, uint256 amountIn, uint256 minAmountOut, address recipient)",
  "function previewSwap(uint8 pair, address tokenIn, uint256 amountIn) view returns (uint256)",
  "function getReservesAB() view returns (uint256,uint256)",
  "function getReservesAC() view returns (uint256,uint256)",
  "function getReservesBC() view returns (uint256,uint256)",
];
