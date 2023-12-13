async function handleBeep(name, payload) {
  const beep = await import(name);

  // Check if the handler function exists
  if (!("handler" in beep) || typeof beep.handler !== "function") {
    throw new Error(`Handler function not found in ${name}`);
  }

  return beep.handler(payload);
}

process.on("message", async (message) => {
  try {
    const { name, payload } = message;
    const { statusCode, body } = await handleBeep(name, payload);

    process.send({ statusCode, body });

    process.exit(0);
  } catch (e) {
    console.error("Error occurred:", e.message);
    process.exit(1);
  }
});