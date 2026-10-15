"""In-memory sliding window rate limiter and daily cap for API protection."""

import asyncio
import time
from typing import Dict, List, Tuple


class RateLimiter:
    """Thread-safe asynchronous rate limiter."""

    def __init__(self, hourly_limit_per_ip: int = 15, daily_limit: int = 300) -> None:
        self.hourly_limit = hourly_limit_per_ip
        self.daily_limit = daily_limit
        self.hourly_window_seconds = 3600.0  # 1 hour
        self.daily_window_seconds = 86400.0  # 24 hours

        self._ip_history: Dict[str, List[float]] = {}
        self._daily_history: List[float] = []
        self._lock = asyncio.Lock()

    async def check(self, client_ip: str) -> Tuple[bool, str]:
        """
        Validates request against rate limits.
        
        Returns:
            Tuple of (is_allowed: bool, rejection_reason: str)
        """
        now = time.time()
        async with self._lock:
            # 1. Prune and check global daily cap
            self._daily_history = [t for t in self._daily_history if now - t < self.daily_window_seconds]
            if len(self._daily_history) >= self.daily_limit:
                return False, "Today's free demo limit is used up. Please try again tomorrow."

            # 2. Prune and check IP hourly limit
            history = self._ip_history.get(client_ip, [])
            history = [t for t in history if now - t < self.hourly_window_seconds]
            self._ip_history[client_ip] = history

            if len(history) >= self.hourly_limit:
                return False, "You've reached the hourly limit for this demo. Try again in a bit."

            # Record request
            self._ip_history[client_ip].append(now)
            self._daily_history.append(now)
            return True, ""
