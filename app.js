document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bakery-form");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressText = document.getElementById("progress-text");
  const toggleInputs = document.querySelectorAll(".toggle-inputs");
  
  // UI Elements
  const btnSend = document.getElementById("btn-send");
  const btnDownload = document.getElementById("btn-download");
  const btnCopy = document.getElementById("btn-copy");
  const btnClear = document.getElementById("btn-clear");
  const toast = document.getElementById("toast");

  // La Access Key de Web3Forms ahora se lee desde el archivo config.js
  const WEB3FORMS_ACCESS_KEY = window.WEB3FORMS_ACCESS_KEY || "TU_ACCESS_KEY_AQUI";
  // Toggle sub-fields visibility
  function setupToggles() {
    toggleInputs.forEach(input => {
      input.addEventListener("change", (e) => {
        const targetId = e.target.dataset.target;
        if (!targetId) return;
        const targetDiv = document.getElementById(targetId);
        
        if (e.target.type === "checkbox") {
          if (e.target.checked) {
            targetDiv.classList.remove("disabled");
            targetDiv.style.display = "flex";
          } else {
            targetDiv.classList.add("disabled");
            targetDiv.style.display = "none";
            // Clear inputs inside
            targetDiv.querySelectorAll("input").forEach(i => i.value = "");
          }
        } else if (e.target.type === "radio") {
          // Si es radio, hay que deshabilitar todos los demas del mismo grupo
          const name = e.target.name;
          const allRadios = document.querySelectorAll(`input[name="${name}"]`);
          allRadios.forEach(radio => {
            if(radio.dataset.target) {
              const div = document.getElementById(radio.dataset.target);
              if (radio.checked) {
                div.classList.remove("disabled");
                div.style.display = "flex";
              } else {
                div.classList.add("disabled");
                div.style.display = "none";
                div.querySelectorAll("input").forEach(i => i.value = "");
              }
            }
          });
        }
        updateProgress();
      });
    });
  }

  // Update Progress Bar
  function updateProgress() {
    const inputs = form.querySelectorAll("input:not([type='hidden'])");
    let total = 0;
    let filled = 0;

    // Solo contamos los inputs que esten visibles (no en divs disabled)
    inputs.forEach(input => {
      const parentSub = input.closest('.sub-fields');
      if (parentSub && parentSub.classList.contains('disabled')) {
        return; // saltar
      }
      
      if (input.type === "checkbox" || input.type === "radio") {
        total++;
        if (input.checked) filled++;
      } else {
        total++;
        if (input.value.trim() !== "") filled++;
      }
    });

    // Dividimos a la mitad para evitar conteo excesivo de campos no relevantes, 
    // pero es solo una estimacion visual
    let percentage = 0;
    if (total > 0) {
      percentage = Math.round((filled / total) * 100);
      if (percentage > 100) percentage = 100;
    }
    
    progressBarFill.style.width = percentage + "%";
    progressText.innerText = percentage + "% completado";
  }

  // Helper function to get value
  const v = (name) => {
    const el = form.elements[name];
    if (!el) return "___";
    return el.value.trim() !== "" ? el.value.trim() : "___";
  };
  
  // Helper for check/radio
  const c = (name, value = null) => {
    if (value) {
      // Radio
      const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
      return radio && radio.checked ? "[X]" : "[ ]";
    } else {
      // Checkbox
      const check = form.elements[name];
      return check && check.checked ? "[X]" : "[ ]";
    }
  };

  // Generate Markdown
  function generateMarkdown() {
    return `# CUESTIONARIO DE RELEVAMIENTO OPERATIVO - PLANTA DE PANIFICACIÓN

Por favor, complete los espacios en blanco o marque con una "X" según corresponda.

---

### SECCIÓN 1: Catálogo de Productos, Presentaciones y Precios
Necesitamos saber qué variedades fabrican, cómo las embolsan y a qué precio las venden.

1. Panes de Hamburguesa (Indique variedades, unidades por paquete y precio de venta por paquete):
- ${c('hamb_clasico_check')} Clásico. Paquetes de: ${v('hamb_clasico_uni')} uni. Precio venta sugerido: $${v('hamb_clasico_precio')} por paquete.
- ${c('hamb_sesamo_check')} Con Sésamo. Paquetes de: ${v('hamb_sesamo_uni')} uni. Precio venta sugerido: $${v('hamb_sesamo_precio')} por paquete.
- ${c('hamb_papa_check')} Pan de Papa. Paquetes de: ${v('hamb_papa_uni')} uni. Precio venta sugerido: $${v('hamb_papa_precio')} por paquete.
- ${c('hamb_brioche_check')} Brioche. Paquetes de: ${v('hamb_brioche_uni')} uni. Precio venta sugerido: $${v('hamb_brioche_precio')} por paquete.
- ${c('hamb_otro_check')} Otro: ${v('hamb_otro_nombre')}. Paquetes de: ${v('hamb_otro_uni')} uni. Precio venta: $${v('hamb_otro_precio')} por paquete.

2. Panes de Pancho / Salchicha:
- ${c('pancho_corto_check')} Corto / Viena. Paquetes de: ${v('pancho_corto_uni')} uni. Precio venta sugerido: $${v('pancho_corto_precio')} por paquete.
- ${c('pancho_largo_check')} Largo / Súper Pancho. Paquetes de: ${v('pancho_largo_uni')} uni. Precio venta sugerido: $${v('pancho_largo_precio')} por paquete.
- ${c('pancho_otro_check')} Otro: ${v('pancho_otro_nombre')}. Paquetes de: ${v('pancho_otro_uni')} uni. Precio venta: $${v('pancho_otro_precio')} por paquete.

3. Vida útil del producto:
- ¿Cuántos días dura el producto envasado antes de su vencimiento?: ${v('vida_util_dias')} días.

---

### SECCIÓN 2: Materia Prima e Insumos Críticos
Cómo compran los insumos para calcular el costo de cada bache de producción.

Indique el tamaño de presentación en que compran cada insumo (ej: Bolsa 50kg, Caja 10kg, Millar):
- Harina: ${v('insumo_harina_pres')} (Costo estimado de la bolsa/presentación: $${v('insumo_harina_costo')})
- Levadura (Fresca / Seca): ${v('insumo_levadura_pres')} (Costo: $${v('insumo_levadura_costo')})
- Grasa / Margarina / Aceite: ${v('insumo_grasa_pres')} (Costo: $${v('insumo_grasa_costo')})
- Sésamo: ${v('insumo_sesamo_pres')} (Costo: $${v('insumo_sesamo_costo')})
- Aditivos / Mejoradores: ${v('insumo_aditivos_pres')} (Costo: $${v('insumo_aditivos_costo')})
- Azúcar: ${v('insumo_azucar_pres')} (Costo: $${v('insumo_azucar_costo')})
- Sal: ${v('insumo_sal_pres')} (Costo: $${v('insumo_sal_costo')})
- Bolsas de Empaque y Precintos: ${v('insumo_bolsas_pres')} (Costo: $${v('insumo_bolsas_costo')})

**Stock Mínimo de Alerta:**
- ¿Con cuántas bolsas de harina restantes en depósito consideran que están en "Stock Crítico"?: ${v('stock_critico_bolsas')} bolsas.

---

### SECCIÓN 3: Recetas y Rendimiento Teórico (El Amasijo)
Tomando como base su tanda/amasijo estándar.

1. Tamaño del amasijo estándar:
- Normalmente, prenden la amasadora utilizando ${v('amasijo_harina_kg')} Kg de harina por tanda.
- ¿Cuántos litros de agua le agregan aproximadamente a esa tanda estándar de harina? ${v('amasijo_agua_litros')} Litros.

2. Peso de corte (Bolladora / Cortadora):
- ¿De cuántos gramos cortan el bollo crudo para la hamburguesa? ${v('peso_hamburguesa_gramos')} gramos.
- ¿De cuántos gramos cortan el bollo crudo para el pancho? ${v('peso_pancho_gramos')} gramos.

3. Rendimiento esperado en un día perfecto:
- Tanda de Hamburguesa: deberían salir ${v('rend_hamburguesa_paquetes')} paquetes terminados.
- Tanda de Pancho: deberían salir ${v('rend_pancho_paquetes')} paquetes terminados.

---

### SECCIÓN 4: Operativa en Planta (Carros y Bandejas)
Para la calculadora rápida de la aplicación.

1. Capacidad de las bandejas:
- ¿Cuántos panes de hamburguesa entran en una bandeja?: ${v('bandeja_hamburguesa_uni')} uni.
- ¿Cuántos panes de pancho entran en una bandeja?: ${v('bandeja_pancho_uni')} uni.

2. Capacidad de los carros:
- ¿Cuántas bandejas entran en un carro completo?: ${v('carro_bandejas_num')} bandejas por carro.

---

### SECCIÓN 5: Mermas y Desperdicios
Cómo miden lo que se pierde durante la jornada.

1. Merma de Masa (Cruda):
¿Miden o pesan la masa que sobra/se descarta antes de hornear?
- ${c('merma_masa', 'Sí, la pesamos en Kilos')} Sí, la pesamos en Kilos.
- ${c('merma_masa', 'No la medimos')} No la medimos.

2. Merma de Producto Terminado (Cocido):
El pan quemado o deforme, ¿cómo lo contabilizan para descartarlo?
- ${c('merma_producto', 'Por unidad')} Por unidad (ej: "se tiraron 15 panes").
- ${c('merma_producto', 'Por bandejas')} Por bandejas (ej: "se quemó media bandeja").
- ${c('merma_producto', 'Por paquetes')} Por paquetes (ej: "se perdieron 3 paquetes").

3. Reciclaje:
El pan de descarte, ¿se reutiliza (ej. para pan rallado o venta secundaria)?
- ${c('reciclaje', 'Sí, se recupera parte del valor')} Sí, se recupera parte del valor ($${v('reciclaje_valor')} por kg/bolsa recuperada).
- ${c('reciclaje', 'No, se tira a la basura (pérdida total)')} No, se tira a la basura (pérdida total).

---

### SECCIÓN 6: Costos y Ventas Diarias
1. Gastos diarios adicionales:
Además de la materia prima, ¿qué otros gastos cargan día a día para restar de la ganancia?
- ${c('gasto_ninguno')} Ninguno, solo materia prima.
- ${c('gasto_combustible')} Combustible / Fletes de entrega.
- ${c('gasto_servicios')} Servicios (Luz/Gas estimados por día).
- ${c('gasto_empleados')} Empleados / Jornales diarios.
- ${c('gasto_otros_check')} Otros: ${v('gasto_otros_detalle')}

2. Modalidad de Ventas y Cobros:
Al finalizar el día, ¿cómo registran las ventas?
- ${c('registro_ventas', 'Contamos los paquetes físicos entregados/vendidos')} Contamos los paquetes físicos entregados/vendidos.
- ${c('registro_ventas', 'Solo contamos el dinero ingresado en caja/banco')} Solo contamos el dinero ingresado en caja/banco.

¿Manejan clientes con Fiado / Cuenta Corriente (pago a 7 o 15 días)?
- ${c('fiado_cc', 'Sí, necesitamos registrar si la venta fue cobrada al contado o quedó pendiente')} Sí, necesitamos registrar si la venta fue cobrada al contado o quedó pendiente.
- ${c('fiado_cc', 'No, todo se cobra en el día')} No, todo se cobra en el día.

---

### SECCIÓN 7: Uso de la App e Infraestructura en Planta
1. Turnos de producción:
- ¿Cuántos turnos trabajan por día? ${v('turnos_cantidad')} turnos (Mañana, Tarde, Noche).

2. Usuario principal:
¿Quién cargará los datos en la app durante el trabajo?
- ${c('usuario_principal', 'Maestro panadero / Cuadrero')} Maestro panadero / Cuadrero.
- ${c('usuario_principal', 'Encargado de turno / Supervisor')} Encargado de turno / Supervisor.
- ${c('usuario_principal', 'El dueño de la planta')} El dueño de la planta.

3. Dispositivo de uso:
¿En qué tipo de dispositivo se usará la aplicación principalmente?
- ${c('dispositivo', 'Celular Android estándar')} Celular Android estándar.
- ${c('dispositivo', 'Celular antiguo / lento')} Celular antiguo/lento.
- ${c('dispositivo', 'Tablet')} Tablet.
- ${c('dispositivo', 'iPhone')} iPhone.

4. Conectividad en la Planta:
¿Hay buena señal de Wi-Fi en la zona de amasado/hornos donde se usará el dispositivo?
- ${c('wifi_planta', 'Sí, hay Wi-Fi en toda la planta')} Sí, hay Wi-Fi en toda la planta.
- ${c('wifi_planta', 'No, la señal va y viene (la app operará la mayor parte del tiempo sin conexión)')} No, la señal va y viene (la app operará la mayor parte del tiempo sin conexión).
`;
  }

  // Show Toast notification
  function showToast(message, type = "success") {
    toast.innerText = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // EVENT LISTENERS
  
  // Update progress on any change
  form.addEventListener("input", updateProgress);
  form.addEventListener("change", updateProgress);

  // Botón Limpiar
  btnClear.addEventListener("click", () => {
    if(confirm("¿Estás seguro de borrar todos los datos ingresados?")) {
      form.reset();
      updateProgress();
      // ocultar sub-campos deshabilitados
      document.querySelectorAll('.sub-fields').forEach(el => {
        el.classList.add('disabled');
        el.style.display = 'none';
      });
      showToast("Formulario limpiado", "success");
    }
  });

  // Botón Copiar
  btnCopy.addEventListener("click", () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md).then(() => {
      showToast("¡Respuestas copiadas al portapapeles!", "success");
    }).catch(err => {
      console.error('Error al copiar:', err);
      showToast("Error al copiar. Tu navegador no lo permite.", "error");
    });
  });

  // Botón Descargar MD
  btnDownload.addEventListener("click", () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "respuestas_relevamiento.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("¡Descarga iniciada!", "success");
  });

  // Botón Enviar (Web3Forms API)
  btnSend.addEventListener("click", async () => {
    if (WEB3FORMS_ACCESS_KEY === "TU_ACCESS_KEY_AQUI") {
      alert("ATENCIÓN: Debes colocar tu Access Key de Web3Forms en el archivo app.js (línea 12) para usar esta función.\nPor ahora puedes descargar o copiar las respuestas.");
      return;
    }

    // Cambiar estado del boton
    const originalText = btnSend.innerHTML;
    btnSend.innerHTML = `<span class="btn-icon">⏳</span> Enviando...`;
    btnSend.disabled = true;

    const md = generateMarkdown();
    
    // Crear objeto para Web3Forms
    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: "Nueva Respuesta: Relevamiento Operativo Panadería",
      from_name: "Cuestionario Web",
      // Mandamos todo el markdown como un solo campo largo
      Mensaje_Markdown: md 
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.status === 200) {
        showToast("¡Enviado exitosamente a tu correo!", "success");
        // Opcional: form.reset();
      } else {
        console.error(result);
        showToast("Hubo un error al enviar.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error de conexión.", "error");
    } finally {
      // Restaurar boton
      btnSend.innerHTML = originalText;
      btnSend.disabled = false;
    }
  });

  // Initialize
  setupToggles();
  updateProgress();
});
