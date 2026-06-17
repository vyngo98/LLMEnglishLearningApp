import torch

from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from unsloth import FastLanguageModel
from trl import SFTTrainer, SFTConfig
from peft import LoraConfig, PeftModel
# !!! MUST import unsloth before trl


def main2():
    dataset = load_dataset(
        "HuggingFaceH4/ultrachat_200k",
        split="train_sft"
    )

    print(dataset[0])
    dataset = dataset.select(range(10000))
    original_columns = dataset.column_names

    model_name = "unsloth/Qwen3-4B-bnb-4bit"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.unk_token

    def format_chat(example):
        text = ""

        for msg in example["messages"]:
            role = msg["role"]
            content = msg["content"]

            text += f"<|im_start|>{role}\n"
            text += content
            text += "<|im_end|>\n"

        return {"text": text}

    # Format dataset
    dataset = dataset.map(
        format_chat,
        remove_columns=original_columns
    )

    # Print sample
    print(dataset[1])

    peft_config = LoraConfig(
        r=16,
        lora_alpha=16,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=['k_proj', 'gate_proj', 'v_proj', 'up_proj', 'q_proj', 'o_proj', 'down_proj']
    )

    # Model to fine-tune
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        # load_in_4bit=True
    )
    model.config.use_cache = False

    args = SFTConfig(
        output_dir="english_teacher",
        learning_rate=2e-4,
        per_device_train_batch_size=2,
        fp16=True,
        bf16=False,
        dataset_text_field="text",
        eos_token="<|im_end|>"
    )

    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=dataset,
        peft_config=peft_config,
        args=args)

    trainer.train()

    model.save_pretrained(
        "english_teacher_lora"
    )

    tokenizer.save_pretrained(
        "english_teacher_lora"
    )


def main():
    max_seq_length = 2048
    model_name = "unsloth/Qwen3-4B-bnb-4bit"
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name="unsloth/Qwen3-4B-bnb-4bit",
        load_in_4bit=True,
    )


    # tokenizer = get_chat_template(
    #     tokenizer,
    #     chat_template="qwen-3",
    # )
    #
    # print(tokenizer.chat_template)
    # tokenizer.pad_token = tokenizer.eos_token

    model = FastLanguageModel.get_peft_model(
        model,
        r=8,
        lora_alpha=16,
    )

    dataset = load_dataset(
        "HuggingFaceH4/ultrachat_200k",
        split="train_sft"
    )

    print(dataset[0])
    dataset = dataset.select(range(10000))


    # def format_chat(example):
    #     return {
    #         "text": tokenizer.apply_chat_template(
    #             example["messages"],
    #             tokenize=False,
    #             add_generation_prompt=False,
    #         )}

    def format_chat(example):
        text = ""

        for msg in example["messages"]:
            role = msg["role"]
            content = msg["content"]

            text += f"<|im_start|>{role}\n"
            text += content
            text += "<|im_end|>\n"

        return {"text": text}

    # print("!!!!!!!!!!!")
    # print(tokenizer.chat_template is not None)

    dataset = dataset.map(
        format_chat,
        remove_columns=dataset.column_names,
    )

    args = SFTConfig(
        output_dir="english_teacher",
        learning_rate=2e-4,
        per_device_train_batch_size=2,
        fp16=True,
        bf16=False,
        dataset_text_field="text",
        max_steps=5,
    )

    # print(tokenizer.eos_token)
    # print(tokenizer.special_tokens_map)
    # print(dataset.column_names)

    # print(tokenizer.convert_tokens_to_ids("<|im_end|>"))
    # print(tokenizer.convert_tokens_to_ids("<EOS_TOKEN>"))

    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=dataset,
        args=args)

    trainer.train()

    model.save_pretrained(
        "english_teacher_lora"
    )

    tokenizer.save_pretrained(
        "english_teacher_lora"
    )

    model.save_pretrained_merged(
        "english_teacher_merged",
        tokenizer,
        save_method="merged_16bit",
    )

    """
    cài llama.cpp thủ công
    git clone https://github.com/ggerganov/llama.cpp.git
    cd llama.cpp
    cmake -B build
    cmake --build build -j
    kiểm tra: ls build/bin
    có thấy llama-quantize; llama-cli ko?
    mkdir -p ~/.unsloth
    ln -s ~/llama.cpp ~/.unsloth/llama.cpp
    kiểm tra: ls ~/.unsloth
    ra output : llama.cpp
    """

    model.save_pretrained_gguf(
        "english_teacher_gguf",
        tokenizer,
        quantization_method="q4_k_m",
    )

    """
    Generated files: ['english_teacher_gguf_gguf/Qwen3-4B.Q4_K_M.gguf']
    Unsloth: example usage for text only LLMs: /home/dongbui-5070ti/.unsloth/llama.cpp/llama-cli --model english_teacher_gguf_gguf/Qwen3-4B.Q4_K_M.gguf -p "why is the sky blue?"
    Unsloth: Saved Ollama Modelfile to english_teacher_gguf_gguf/Modelfile
    Unsloth: convert model to ollama format by running - ollama create model_name -f english_teacher_gguf_gguf/Modelfile
    """

main()
