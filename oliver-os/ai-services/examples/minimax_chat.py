import os
from pathlib import Path
from openai import OpenAI

# Load .env file if available
try:
    from dotenv import load_dotenv
    # Load .env from parent directory (oliver-os/.env)
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass  # dotenv not available, continue without it

def main() -> None:
    api_key = os.getenv("MINIMAX_API_KEY", "")
    base_url = os.getenv("MINIMAX_BASE_URL", "https://api.minimax.io/v1")
    model = os.getenv("MINIMAX_MODEL", "MiniMax-M2")

    if not api_key:
        print("MINIMAX_API_KEY is not set. Please export it or set it in .env.")
        return

    client = OpenAI(base_url=base_url, api_key=api_key)

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": "Explain machine learning in simple terms"
            }
        ],
    )

    print(resp.choices[0].message.content)


if __name__ == "__main__":
    main()


