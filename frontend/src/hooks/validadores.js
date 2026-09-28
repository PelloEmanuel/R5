const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reglas de validación para el formulario de registro.
 * La validación real y definitiva ocurre en el backend; esto solo
 * mejora la experiencia del usuario evitando solicitudes innecesarias.
 */
export function validarRegistro(valores) {
  const errores = {};

  if (!valores.nombre?.trim()) {
    errores.nombre = 'El nombre es obligatorio.';
  }
  if (!valores.apellido?.trim()) {
    errores.apellido = 'El apellido es obligatorio.';
  }
  if (!valores.email?.trim()) {
    errores.email = 'El email es obligatorio.';
  } else if (!PATRON_EMAIL.test(valores.email)) {
    errores.email = 'El email no tiene un formato válido.';
  }
  if (!valores.password) {
    errores.password = 'La contraseña es obligatoria.';
  } else if (valores.password.length < 8) {
    errores.password = 'Debe tener al menos 8 caracteres.';
  } else if (!/[A-Za-z]/.test(valores.password) || !/[0-9]/.test(valores.password)) {
    errores.password = 'Debe combinar letras y números.';
  }

  return errores;
}

/**
 * Reglas de validación para el formulario de creación/edición usado por
 * administrador y dueño. La contraseña solo es obligatoria al crear.
 */
export function validarGestionUsuario(valores, { requierePassword }) {
  const errores = {};

  if (!valores.nombre?.trim()) {
    errores.nombre = 'El nombre es obligatorio.';
  }
  if (!valores.apellido?.trim()) {
    errores.apellido = 'El apellido es obligatorio.';
  }
  if (!valores.email?.trim()) {
    errores.email = 'El email es obligatorio.';
  } else if (!PATRON_EMAIL.test(valores.email)) {
    errores.email = 'El email no tiene un formato válido.';
  }

  if (requierePassword) {
    if (!valores.password) {
      errores.password = 'La contraseña es obligatoria.';
    } else if (valores.password.length < 8) {
      errores.password = 'Debe tener al menos 8 caracteres.';
    } else if (!/[A-Za-z]/.test(valores.password) || !/[0-9]/.test(valores.password)) {
      errores.password = 'Debe combinar letras y números.';
    }
  }

  return errores;
}

/** Reglas de validación para el formulario de inicio de sesión. */
export function validarLogin(valores) {
  const errores = {};

  if (!valores.email?.trim()) {
    errores.email = 'El email es obligatorio.';
  } else if (!PATRON_EMAIL.test(valores.email)) {
    errores.email = 'El email no tiene un formato válido.';
  }
  if (!valores.password) {
    errores.password = 'La contraseña es obligatoria.';
  }

  return errores;
}
