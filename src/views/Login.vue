<template>
    <div class="login-page">
        <!-- Right-side semi-transparent panel -->
        <div class="login-panel">
            <!-- Centered login container within the panel -->
            <div class="login-container">
                <h1>Login</h1>
                <form @submit.prevent="login">
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input id="username" type="text" v-model="username" required />
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input id="password" type="password" v-model="password" required />
                    </div>
                    <button type="submit">Login</button>
                </form>
                <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "LoginPage",
    data() {
        return {
            username: "",
            password: "",
            errorMessage: ""
        };
    },
    methods: {
        login() {
            // Example static credentials:
            if (this.username === "teacher" && this.password === "teacher123") {
                sessionStorage.setItem("isAuthenticated", "true");
                sessionStorage.setItem("userRole", "teacher");
                this.$router.push({ name: "OverviewPage" });
            } else if (this.username === "student" && this.password === "student123") {
                sessionStorage.setItem("isAuthenticated", "true");
                sessionStorage.setItem("userRole", "student");
                this.$router.push({ name: "OverviewPage" });
            } else {
                this.errorMessage = "Invalid credentials. Please try again.";
            }
        }
    }
};
</script>

<style scoped>
/* Full-screen wallpaper background */
.login-page {
    position: relative;
    height: 100vh;
    width: 100%;
    background: url('@/assets/ite_wallpaper.jpg') no-repeat center center/cover;
}

/* Right panel: covers 40% of the screen width, full height, with 50% transparent white */
.login-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: 40%;
    height: 100%;
    background: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Login container: centers the form inside the panel */
.login-container {
    width: 80%;
    max-width: 400px;
    /* Optional: additional background for the form container (more opaque than the panel)
       Uncomment the next line if you want an extra layer of opacity */
    /* background: rgba(255, 255, 255, 0.8); */
    padding: 2rem;
    border-radius: 8px;
    /* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); */
}

.login-container h1 {
    text-align: center;
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.login-container label {
    display: block;
    margin-bottom: 0.5rem;
}

.login-container input {
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
}

.login-container button {
    width: 100%;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.login-container button:hover {
    background: #0056b3;
}

.error {
    color: red;
    text-align: center;
    margin-top: 1rem;
}
</style>