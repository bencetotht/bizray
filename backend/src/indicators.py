def debt_to_equity_ratio(total_assets: float, total_liabilities: float) -> float:
    """
    Calculates the debt to equity ratio.
    Parameters:
    - total_assets: float
    - total_liabilities: float
    Returns:
    - debt to equity ratio: float
    """
    if total_assets == 0:
        return 0
    return total_liabilities / total_assets