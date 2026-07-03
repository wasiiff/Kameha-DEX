// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title TripleSwap
/// @notice Reference implementation of the DEX behind DEX_ADDRESS (matches DEX_ABI).
///         A constant-product AMM over three tokens (A=PLAT, B=SIMP, C=LMN) exposed
///         as three pairs addressed by a uint8 id:
///           pair 1 = A/B, pair 2 = A/C, pair 3 = B/C
///         Charges a 0.3% swap fee. Liquidity is pooled (no LP tokens minted — this
///         is a minimal reference matching the frontend's read/write surface).
contract TripleSwap {
    uint256 public constant FEE_BPS = 30; // 0.30%
    uint256 private constant BPS = 10_000;

    address public immutable tokenA;
    address public immutable tokenB;
    address public immutable tokenC;

    struct Pool {
        uint256 reserve1; // reserve of the pair's first token
        uint256 reserve2; // reserve of the pair's second token
    }

    // pair id => pool
    mapping(uint8 => Pool) private pools;

    constructor(address _tokenA, address _tokenB, address _tokenC) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        tokenC = _tokenC;
    }

    // ------------------ Pair helpers ------------------

    /// @dev Returns the ordered (token1, token2) for a pair id.
    function _pairTokens(uint8 pair) internal view returns (address t1, address t2) {
        if (pair == 1) return (tokenA, tokenB);
        if (pair == 2) return (tokenA, tokenC);
        if (pair == 3) return (tokenB, tokenC);
        revert("invalid pair");
    }

    // ------------------ Liquidity ------------------

    function addLiquidity(uint8 pair, uint256 amount1, uint256 amount2) external returns (bool) {
        (address t1, address t2) = _pairTokens(pair);
        require(IERC20(t1).transferFrom(msg.sender, address(this), amount1), "transfer1 failed");
        require(IERC20(t2).transferFrom(msg.sender, address(this), amount2), "transfer2 failed");
        pools[pair].reserve1 += amount1;
        pools[pair].reserve2 += amount2;
        return true;
    }

    // ------------------ Swap ------------------

    /// @dev Constant-product output with fee: out = (rOut * amtInAfterFee) / (rIn + amtInAfterFee)
    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256)
    {
        require(amountIn > 0, "amountIn=0");
        require(reserveIn > 0 && reserveOut > 0, "no liquidity");
        uint256 amountInWithFee = amountIn * (BPS - FEE_BPS);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * BPS) + amountInWithFee;
        return numerator / denominator;
    }

    function previewSwap(uint8 pair, address tokenIn, uint256 amountIn)
        public
        view
        returns (uint256)
    {
        (address t1, address t2) = _pairTokens(pair);
        Pool storage p = pools[pair];
        if (tokenIn == t1) {
            return _getAmountOut(amountIn, p.reserve1, p.reserve2);
        } else if (tokenIn == t2) {
            return _getAmountOut(amountIn, p.reserve2, p.reserve1);
        }
        revert("tokenIn not in pair");
    }

    function swapExactInput(
        uint8 pair,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut) {
        (address t1, address t2) = _pairTokens(pair);
        Pool storage p = pools[pair];

        address tokenOut;
        if (tokenIn == t1) {
            amountOut = _getAmountOut(amountIn, p.reserve1, p.reserve2);
            tokenOut = t2;
            p.reserve1 += amountIn;
            p.reserve2 -= amountOut;
        } else if (tokenIn == t2) {
            amountOut = _getAmountOut(amountIn, p.reserve2, p.reserve1);
            tokenOut = t1;
            p.reserve2 += amountIn;
            p.reserve1 -= amountOut;
        } else {
            revert("tokenIn not in pair");
        }

        require(amountOut >= minAmountOut, "slippage");
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "transferIn failed");
        require(IERC20(tokenOut).transfer(recipient, amountOut), "transferOut failed");
    }

    // ------------------ Reserve views ------------------

    function getReservesAB() external view returns (uint256, uint256) {
        Pool storage p = pools[1];
        return (p.reserve1, p.reserve2);
    }

    function getReservesAC() external view returns (uint256, uint256) {
        Pool storage p = pools[2];
        return (p.reserve1, p.reserve2);
    }

    function getReservesBC() external view returns (uint256, uint256) {
        Pool storage p = pools[3];
        return (p.reserve1, p.reserve2);
    }
}
