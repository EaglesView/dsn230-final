export const APIRequest = async ({ endpoint, action, params }) => {
  const formData = new FormData();
  formData.append("action", action);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }
  }
  console.log(formData);
  fetch(`/backend/${endpoint}.php`, {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((response) => {
      console.log(response);
      return response;
    });
  return "UNKNOWN ERROR";
};
export const APIRequestRAW = async ({ endpoint, action, params }) => {
  const body = new URLSearchParams(params);
  if (action) body.append("action", action);
  const response = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body,
  });
  const data = await response.json();
  return data;
};
