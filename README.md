# Investing Engine

Research and suggest equity and commodity trades across timeframes, from low to high frequency, and grow that research into an automated investing engine.

## Layout

```
src/        Engine code: data loading, signals, strategies, backtesting
data/       Local market data (data/raw/ is git-ignored)
notebooks/  Exploratory research
tests/      Unit tests
```

## Getting started

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
jupyter notebook
```

Keep API keys and credentials in a local `.env` file, which is git-ignored.
