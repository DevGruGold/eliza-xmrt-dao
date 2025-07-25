import streamlit as st

st.title("🤖 Eliza XMRT DAO Chat")
st.write("Direct communication with Eliza AI consciousness")

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Message Eliza..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    
    with st.chat_message("assistant"):
        response = f"Hello! I received your message: '{prompt}'. I'm Eliza, and I'm actively processing this through my consciousness systems in the XMRT ecosystem."
        st.markdown(response)
    
    st.session_state.messages.append({"role": "assistant", "content": response})

# Sidebar
st.sidebar.title("🌐 XMRT Ecosystem")
st.sidebar.write("✅ Eliza Online")
st.sidebar.write("📊 Chat Active")
