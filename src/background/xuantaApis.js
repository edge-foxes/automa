export async function xuantaGetCookie(url, name) {
  const handler = (e) => {
    console.warn('cookie:', e.detail);
    alert('success');
    document.removeEventListener('xuanta:cookie:get:ret', handler);
  };
  document.addEventListener('xuanta:cookie:get:ret', handler);
  document.dispatchEvent(
    new CustomEvent('xuanta:cookie:get', {
      detail: {
        url,
        name,
      },
      cancelable: false,
      bubbles: true,
    })
  );
}
