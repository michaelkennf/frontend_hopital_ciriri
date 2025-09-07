<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Connexion</h1>
      <form>
        <label class="block mb-2 text-sm font-medium text-gray-700">Nom d'utilisateur</label>
        <input type="text" class="w-full p-2 border rounded mb-4" placeholder="Entrez votre nom d'utilisateur" />

        <label class="block mb-2 text-sm font-medium text-gray-700">Mot de passe</label>
        <input type="password" class="w-full p-2 border rounded mb-6" placeholder="Entrez votre mot de passe" />

        <button class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Se connecter</button>
      </form>
    </div>
  </div>
</template>
