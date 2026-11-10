
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
