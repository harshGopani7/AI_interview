import VoiceInput from "./VoiceInput";

export default function InterviewForm({
  value,
  onChange,
  onSend,
  disabled,
}) {
  return (
    <>
      <textarea
        placeholder={
          disabled ? "Please wait for interviewer..." : "Type or speak your answer..."
        }
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />

      {/* <textarea
        onPaste={(e) => {
          e.preventDefault();
          alert("⚠️ Pasting is disabled during the interview.");
        }}
        onCopy={(e) => e.preventDefault()}
      /> */}


      <div style={{ display: "flex", marginTop: "8px" }}>
        <VoiceInput
          disabled={disabled}
          onResult={(text) => onChange(text)}
        />

        <button
          className="btn-primary"
          onClick={onSend}
          disabled={disabled}
        >
          Send
        </button>
      </div>
    </>
  );
}
