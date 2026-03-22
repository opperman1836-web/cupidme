export default function Home() {
  return (
    <main style={{
      display: "flex",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
      background: "#5a60ea",
      color: "white",
      textAlign: "center",
      padding: "20px"
    }}>
      <div>
        <h1>New Skills Academy</h1>
        <h2>Caregiver Course – R2000</h2>
        <p>No matric needed</p>
        <p>Includes First Aid + HIV Counselling</p>
        <p>3 Accredited Certificates</p>
        <p>Start immediately</p>
        <a href="https://wa.me/2760782238" target="_blank">
          <button style={{
            marginTop: "20px",
            padding: "15px 25px",
            fontSize: "18px",
            background: "#00ff88",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}>
            Apply Now on WhatsApp
          </button>
        </a>
      </div>
    </main>
  );
}
