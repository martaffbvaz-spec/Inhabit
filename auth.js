
/* INHABIT — CONTAS PESSOAIS */

const inhabitAuth = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

async function criarConta(email, password) {
  const { data, error } = await inhabitAuth.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        "https://martaffbvaz-spec.github.io/Inhabit/"
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

async function entrarNaConta(email, password) {
  const { data, error } =
    await inhabitAuth.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    throw error;
  }

  return data;
}

async function sairDaConta() {
  const { error } = await inhabitAuth.auth.signOut();

  if (error) {
    throw error;
  }
}

/* INHABIT — ABRIR E FECHAR CONTA */

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("authOverlay");
  const closeButton = document.getElementById("authClose");

const switchButton = document.getElementById("authSwitch");
const submitButton = document.getElementById("authSubmit");
const title = document.querySelector(".auth-panel h2");

let modoLogin = false;

switchButton.addEventListener("click", () => {
  modoLogin = !modoLogin;

  if (modoLogin) {
    title.textContent = "Welcome back.";
    submitButton.textContent = "LOG IN ↗";
    switchButton.textContent = "NEW HERE? CREATE ACCOUNT";
  } else {
    title.textContent = "Your space, wherever you are.";
    submitButton.textContent = "CREATE ACCOUNT ↗";
    switchButton.textContent =
      "ALREADY HAVE AN ACCOUNT? LOG IN";
  }
});

  if (!overlay || !closeButton) return;

  // Permite abrir o formulário a partir de outros botões.
  window.abrirContaInhabit = function () {
    overlay.hidden = false;
  };

  // Fecha o formulário.
  closeButton.addEventListener("click", () => {
    overlay.hidden = true;
  });

  // Fecha ao clicar fora do painel.
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.hidden = true;
    }
  });

  // Fecha com a tecla Escape.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      overlay.hidden = true;
    }
  });
});
