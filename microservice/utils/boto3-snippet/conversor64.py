import base64
  
  
user ="code64="
password ="coder64"
def decode64(string):
    base64_bytes = string.encode("utf-8")  
    sample_string_bytes = base64.b64decode(base64_bytes)
    sample_string = sample_string_bytes.decode("utf-8")
    return sample_string
  
print(f"User: {decode64(user)}")
print(f"Pass: {decode64(password)}")