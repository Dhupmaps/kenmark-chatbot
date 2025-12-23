import pandas as pd

data = {
    "Category": ["About", "Services", "Contact"],
    "Question": [
        "What is Kenmark?",
        "What services do you offer?",
        "How do I contact you?"
    ],
    "Answer": [
        "Kenmark ITan Solutions is a tech company specializing in AI and web dev.",
        "We offer Web Development, AI Chatbots, and Cloud Consulting.",
        "Email us at contact@kenmarkitan.com."
    ]
}

df = pd.DataFrame(data)

df.to_excel("knowledge.xlsx", index=False)

print(" Success! knowledge.xlsx has been created with data.")