import { useEffect, useState } from "react";

function App() {
    const [mensagem, setMensagem] = useState("");

    useEffect(() => {
        fetch("http://localhost:8000/api/teste/")
            .then((res) => res.json())
            .then((data) => setMensagem(data.mensagem))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div>
            <h1>Teste Django + React</h1>
            <p>{mensagem}</p>
        </div>
    );
}

export default App;