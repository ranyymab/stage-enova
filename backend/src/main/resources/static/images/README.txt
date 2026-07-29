Place the Enova Robotics logo file here as:

    enova-logo.png

Anything dropped in this folder (backend/src/main/resources/static/images/)
is served automatically by Spring Boot at:

    http://localhost:8081/images/enova-logo.png

The frontend (sidebar + login page) already points to that URL. Until the
real file is added here, the app falls back automatically to the logo's
current external URL, so nothing breaks in the meantime — once you drop the
real PNG in this folder, it switches to the local copy with no further
changes needed.

(This placeholder file couldn't be replaced with the actual image directly
in this environment: the sandbox's network egress allowlist doesn't include
the site the logo was linked from, so the binary couldn't be downloaded
here. Just add the real file with this exact name.)
