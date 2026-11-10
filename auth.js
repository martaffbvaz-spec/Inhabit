
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

/* INHABIT — REGISTO E LOGIN */

const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value;

  authMessage.textContent = "PLEASE WAIT...";
  submitButton.disabled = true;

  try {
    if (modoLogin) {
      await entrarNaConta(email, password);
      authMessage.textContent = "WELCOME BACK!";
    } else {
      await criarConta(email, password);
      authMessage.textContent =
        "CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT.";
    }
  } catch (error) {
    authMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

});

/* INHABIT — ACCOUNT NA NAVEGAÇÃO */

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".landing-nav");

  if (!nav || document.getElementById("accountNavButton")) {
    return;
  }

  const accountButton = document.createElement("button");

  accountButton.id = "accountNavButton";
  accountButton.type = "button";
  accountButton.textContent = "ACCOUNT";

  nav.appendChild(accountButton);

  accountButton.addEventListener("click", async () => {
    const { data, error } = await inhabitAuth.auth.getSession();

    if (error) {
      console.error("Erro ao verificar a sessão:", error.message);
      return;
    }

   
if (data.session) {
  const accountOverlay = document.getElementById("accountOverlay");
  const accountEmail = document.getElementById("accountEmail");

  if (accountOverlay && accountEmail) {
    accountEmail.textContent = data.session.user.email;
    accountOverlay.hidden = false;
  }
} else {
  window.abrirContaInhabit();
}

/* INHABIT — FECHAR DEFINIÇÕES DA CONTA */

document.addEventListener("DOMContentLoaded", () => {
  const accountOverlay = document.getElementById("accountOverlay");
  const accountClose = document.getElementById("accountClose");

  if (!accountOverlay || !accountClose) return;

  accountClose.addEventListener("click", () => {
    accountOverlay.hidden = true;
  });

  accountOverlay.addEventListener("click", (event) => {
    if (event.target === accountOverlay) {
      accountOverlay.hidden = true;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      accountOverlay.hidden = true;
    }
  });
});

  });
});
