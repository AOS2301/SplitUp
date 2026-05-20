<template>
  <div class="app-wrapper">
    <header class="navbar">
      <div class="navbar-inner">
        <span class="logo">Split<strong>AI</strong></span>
      </div>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  background: #0f1117;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 50;

  background: rgba(15,17,23,.7);

  backdrop-filter: blur(18px);

  border-bottom: 1px solid rgba(255,255,255,.06);

  padding: 0 1.5rem;

  height: 56px;

  display: flex;
  align-items: center;
}

.navbar-inner {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

.logo {
  font-size: 1.6rem;
  letter-spacing: -.04em;
  color: #f3f4f6;
}

.logo strong {
  color: #8b5cf6;
}
</style>