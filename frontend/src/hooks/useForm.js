import { useState } from 'react';

/**
 * Hook de formularios reutilizable.
 *
 * @param {object} valoresIniciales - valores iniciales de cada campo.
 * @param {function} validar - función que recibe los valores y devuelve
 *                              un objeto { campo: 'mensaje de error' }.
 */
export function useForm(valoresIniciales, validar) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});

  /** Actualiza un campo del formulario a partir del evento del input. */
  function manejarCambio(evento) {
    const { name, value } = evento.target;
    setValores((anteriores) => ({ ...anteriores, [name]: value }));
  }

  /** Ejecuta la validación y actualiza los errores. Devuelve si es válido. */
  function validarFormulario() {
    const erroresEncontrados = validar(valores);
    setErrores(erroresEncontrados);
    return Object.keys(erroresEncontrados).length === 0;
  }

  /** Vuelve el formulario a sus valores iniciales. */
  function reiniciarFormulario() {
    setValores(valoresIniciales);
    setErrores({});
  }

  return { valores, errores, manejarCambio, validarFormulario, reiniciarFormulario };
}
