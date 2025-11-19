from datetime import time
from typing import List
import logging

logger = logging.getLogger(__name__)

def normalize_capture_times(time_list: List[str]) -> List[str]:
    """
    Validates and normalizes a list of time strings into HH:MM:SS format.
    - Accepts partial times: "6", "6:30", "6:30:15" (coerces to "06:00:00", "06:30:00", etc.)
    - Returns sorted list of unique times in "HH:MM:SS" format.
    - Logs exact duplicates but does not raise.
    - Raises ValueError on malformed entries.

    Args:
        time_list (List[str]): List of strings representing times.

    Returns:
        List[str]: Chronologically sorted, deduplicated list of HH:MM:SS time strings.
    """
    if not isinstance(time_list, list):
        raise ValueError("capture_at_times must be a list of strings.")

    normalized_set = set()
    normalized_times = []

    for t_str in time_list:
        try:
            parts = [int(p) for p in t_str.strip().split(":") if p != ""]
            if not parts:
                raise ValueError("Empty time entry.")

            while len(parts) < 3:
                parts.append(0)  # Fill missing mins/secs with zero

            h, m, s = parts
            t_obj = time(hour=h, minute=m, second=s)
            norm_str = t_obj.strftime("%H:%M:%S")

            if norm_str in normalized_set:
                logger.warning(f"[Time Utils] Duplicate capture time ignored: {norm_str}")
            else:
                normalized_set.add(norm_str)
                normalized_times.append(t_obj)

        except Exception as e:
            raise ValueError(f"Invalid time format: '{t_str}'. Must be HH[:MM[:SS]] and valid values.") from e

    normalized_times.sort()
    return [t.strftime("%H:%M:%S") for t in normalized_times]
