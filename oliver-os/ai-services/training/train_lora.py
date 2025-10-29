"""
Train a LoRA adapter from SFT-style dataset
- Input: training/output/sft_dataset.jsonl (fields: instruction, input, output)
- Output: training/output/lora_adapter/
Requires: transformers, peft, accelerate, datasets, torch
Note: Windows CPU-only training will be slow; GPU recommended.
"""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict

import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, DataCollatorForLanguageModeling, Trainer, TrainingArguments
from peft import LoraConfig, get_peft_model


def format_example(ex: Dict[str, str]) -> str:
    instr = ex.get('instruction', '')
    inp = ex.get('input', '')
    out = ex.get('output', '')
    parts = []
    if instr:
        parts.append(f"### Instruction\n{instr}")
    if inp:
        parts.append(f"### Input\n{inp}")
    parts.append(f"### Response\n{out}")
    return '\n\n'.join(parts) + '\n'


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--base-model', default='microsoft/Phi-3-mini-4k-instruct', help='HF model id (small instruct)')
    ap.add_argument('--data', default=str(Path(__file__).resolve().parent / 'output' / 'sft_dataset.jsonl'))
    ap.add_argument('--out', default=str(Path(__file__).resolve().parent / 'output' / 'lora_adapter'))
    ap.add_argument('--epochs', type=int, default=1)
    ap.add_argument('--batch', type=int, default=1)
    ap.add_argument('--lr', type=float, default=2e-4)
    args = ap.parse_args()

    dataset = load_dataset('json', data_files=args.data, split='train')
    dataset = dataset.map(lambda ex: { 'text': format_example(ex) })

    tokenizer = AutoTokenizer.from_pretrained(args.base_model, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    def tok_fn(ex):
        return tokenizer(ex['text'], truncation=True, padding='max_length', max_length=1024)

    tokenized = dataset.map(tok_fn, batched=True, remove_columns=dataset.column_names)

    model = AutoModelForCausalLM.from_pretrained(args.base_model)
    lora_cfg = LoraConfig(r=8, lora_alpha=16, lora_dropout=0.1, target_modules=['q_proj','v_proj'], task_type='CAUSAL_LM')
    model = get_peft_model(model, lora_cfg)

    collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    out_dir = args.out
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=out_dir,
        per_device_train_batch_size=args.batch,
        num_train_epochs=args.epochs,
        learning_rate=args.lr,
        fp16=torch.cuda.is_available(),
        logging_steps=10,
        save_steps=200,
        save_total_limit=2,
        report_to=[]
    )

    trainer = Trainer(model=model, args=training_args, train_dataset=tokenized, data_collator=collator)
    trainer.train()
    trainer.save_model(out_dir)

    print(f"✅ LoRA adapter saved at: {out_dir}")


if __name__ == '__main__':
    main()
