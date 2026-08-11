document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bakery-form");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressText = document.getElementById("progress-text");
  
  // UI Elements
  const btnSend = document.getElementById("btn-send");
  const btnDownload = document.getElementById("btn-download");
  const btnCopy = document.getElementById("btn-copy");
  const btnClear = document.getElementById("btn-clear");
  const toast = document.getElementById("toast");

  const WEB3FORMS_ACCESS_KEY = window.WEB3FORMS_ACCESS_KEY || "TU_ACCESS_KEY_AQUI"; 

  // --- 1. TOGGLES & ACLARACIONES ---
  function bindDynamicEvents(container = document) {
    // Toggles de inputs (disabled/enabled)
    container.querySelectorAll(".toggle-inputs").forEach(input => {
      // Evitar bindear multiples veces
      if(input.dataset.bound) return;
      input.dataset.bound = true;

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
            targetDiv.querySelectorAll("input").forEach(i => i.value = "");
          }
        } else if (e.target.type === "radio") {
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

    // Toggles de aclaraciones
    container.querySelectorAll(".toggle-aclaracion").forEach(input => {
      if(input.dataset.bound) return;
      input.dataset.bound = true;

      input.addEventListener("change", (e) => {
        const box = e.target.closest('.aclaracion-box');
        const txt = box.querySelector('.aclaracion-text');
        if(e.target.checked) {
          txt.classList.remove("hidden");
          txt.focus();
        } else {
          txt.classList.add("hidden");
          txt.value = "";
        }
      });
    });
  }

  // --- 2. MULTIPLES OTROS ---
  window.addDynamicItem = function(type, title, isGasto = false, isTable = false) {
    const container = document.getElementById(`dynamic-${type}`);
    const count = parseInt(container.dataset.count);
    const newCount = count + 1;
    container.dataset.count = newCount;

    const btn = container.querySelector('.btn-add-more');
    const newItem = document.createElement('div');
    newItem.className = "option-card full-width dynamic-item";
    
    
    let innerHTML = '';
    if(isTable) {
      const tr = document.createElement('tr');
      tr.className = "dynamic-item";
      tr.innerHTML = `
        <td><input type="text" name="${type}_nombre_${count}" placeholder="ej: Semillas"></td>
        <td><input type="text" name="${type}_pres_${count}" placeholder="ej: Bolsa 10kg"></td>
        <td>
          <div class="input-with-prefix">
            <span class="prefix">$</span>
            <input type="number" name="${type}_costo_${count}" placeholder="0.00" step="0.01">
          </div>
        </td>
      `;
      container.appendChild(tr);
      return; // No usamos insertBefore porque es tbody y boton esta fuera
    }
    if(!isGasto) {
      innerHTML = `
        <label class="custom-checkbox-label">
          <input type="checkbox" name="${type}_otro_check_${count}" class="toggle-inputs" data-target="${type}_otro_fields_${count}">
          <span class="checkbox-custom"></span>
          <span class="option-title">${title} ${newCount}</span>
        </label>
        <div id="${type}_otro_fields_${count}" class="sub-fields disabled">
          <div class="input-inline">
            <label>Nombre Variedad:</label>
            <input type="text" name="${type}_otro_nombre_${count}" placeholder="ej: Nueva Variedad">
          </div>
          <div class="input-inline">
            <label>Paquetes de:</label>
            <div class="input-with-suffix">
              <input type="number" name="${type}_otro_uni_${count}" placeholder="ej: 6" min="1">
              <span class="suffix">uni</span>
            </div>
          </div>
          <div class="input-inline">
            <label>Precio venta:</label>
            <div class="input-with-prefix">
              <span class="prefix">$</span>
              <input type="number" name="${type}_otro_precio_${count}" placeholder="0.00" step="0.01">
            </div>
          </div>
        </div>
      `;
    } else {
      innerHTML = `
        <label class="custom-checkbox-label">
          <input type="checkbox" name="${type}_otros_check_${count}" class="toggle-inputs" data-target="${type}_otros_fields_${count}">
          <span class="checkbox-custom"></span>
          <span>${title} ${newCount}</span>
        </label>
        <div id="${type}_otros_fields_${count}" class="sub-fields disabled">
          <input type="text" name="${type}_otros_detalle_${count}" placeholder="Especifique cuáles">
        </div>
      `;
    }
    
    newItem.innerHTML = innerHTML;
    container.insertBefore(newItem, btn);
    bindDynamicEvents(newItem);
  };

  // --- 3. SCROLLSPY ---
  const sections = document.querySelectorAll(".card-section");
  const navItems = document.querySelectorAll(".nav-item");

  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -60% 0px",
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remover active de todos
        navItems.forEach(item => item.classList.remove("active"));
        // Buscar el link que corresponde a esta seccion
        const id = entry.target.getAttribute("id");
        const activeLink = document.querySelector(`.nav-item[href="#${id}"]`);
        if(activeLink) activeLink.classList.add("active");
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Update Progress Bar
  function updateProgress() {
    const inputs = form.querySelectorAll("input:not([type='hidden']):not(.toggle-aclaracion)");
    let total = 0;
    let filled = 0;

    inputs.forEach(input => {
      const parentSub = input.closest('.sub-fields');
      if (parentSub && parentSub.classList.contains('disabled')) return; 
      
      if (input.type === "checkbox" || input.type === "radio") {
        total++;
        if (input.checked) filled++;
      } else {
        total++;
        if (input.value.trim() !== "") filled++;
      }
    });

    let percentage = 0;
    if (total > 0) {
      percentage = Math.round((filled / total) * 100);
      if (percentage > 100) percentage = 100;
    }
    
    progressBarFill.style.width = percentage + "%";
    progressText.innerText = percentage + "% completado";
  }

  // --- HELPERS PARA GENERAR MD ---
  const v = (name) => {
    const el = form.elements[name];
    if (!el) return "___";
    return el.value.trim() !== "" ? el.value.trim() : "___";
  };
  
  const c = (name, value = null) => {
    if (value) {
      const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
      return radio && radio.checked ? "[x]" : "[ ]";
    } else {
      const check = form.elements[name];
      return check && check.checked ? "[x]" : "[ ]";
    }
  };

  // Helper para buscar aclaraciones en el HTML por contexto 
  // Usa el texto de la pregunta para ubicar el group y extraer el textarea
  const getAclaracion = (searchString) => {
    // Busca el titulo o label cercano
    const headers = document.querySelectorAll('h3, .hint');
    let targetGroup = null;
    headers.forEach(h => {
      if(h.innerText.includes(searchString)) {
        targetGroup = h.closest('.question-group');
      }
    });
    // Fallback: buscar label
    if(!targetGroup) {
      const labels = document.querySelectorAll('label');
      labels.forEach(l => {
        if(l.innerText.includes(searchString)) targetGroup = l.closest('.question-group');
      });
    }

    if(targetGroup) {
      const txt = targetGroup.querySelector('.aclaracion-text');
      if(txt && txt.value.trim() !== "") {
        return `\n> *Aclaración del cliente:* ${txt.value.trim()}\n`;
      }
    }
    return "";
  };

  // Generar listas dinamicas
  
  const getDynamicInsumo = () => {
    let str = "";
    const container = document.getElementById('dynamic-insumo');
    if(!container) return "";
    const count = parseInt(container.dataset.count);
    for(let i=0; i<count; i++) {
      if(form.elements[`insumo_nombre_${i}`]) {
        str += `- ${v(`insumo_nombre_${i}`)}: ${v(`insumo_pres_${i}`)} (Costo: ${v(`insumo_costo_${i}`)})\n`;
      }
    }
    return str.trimEnd();
  };

  const getDynamicHamb = () => {
    let str = "";
    const container = document.getElementById('dynamic-hamb');
    const count = parseInt(container.dataset.count);
    for(let i=0; i<count; i++) {
      if(form.elements[`hamb_otro_check_${i}`]) {
        str += `- ${c(`hamb_otro_check_${i}`)} Otro: ${v(`hamb_otro_nombre_${i}`)}. Paquetes de: ${v(`hamb_otro_uni_${i}`)} uni. Precio venta: $${v(`hamb_otro_precio_${i}`)} por paquete.\n`;
      }
    }
    return str.trimEnd();
  };

  const getDynamicPancho = () => {
    let str = "";
    const container = document.getElementById('dynamic-pancho');
    const count = parseInt(container.dataset.count);
    for(let i=0; i<count; i++) {
      if(form.elements[`pancho_otro_check_${i}`]) {
        str += `- ${c(`pancho_otro_check_${i}`)} Otro: ${v(`pancho_otro_nombre_${i}`)}. Paquetes de: ${v(`pancho_otro_uni_${i}`)} uni. Precio venta: $${v(`pancho_otro_precio_${i}`)} por paquete.\n`;
      }
    }
    return str.trimEnd();
  };

  const getDynamicGasto = () => {
    let str = "";
    const container = document.getElementById('dynamic-gasto');
    const count = parseInt(container.dataset.count);
    for(let i=0; i<count; i++) {
      if(form.elements[`gasto_otros_check_${i}`]) {
        str += `- ${c(`gasto_otros_check_${i}`)} Otros: ${v(`gasto_otros_detalle_${i}`)}\n`;
      }
    }
    return str.trimEnd();
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
${getDynamicHamb()}
${getAclaracion('1. Panes de Hamburguesa')}

2. Panes de Pancho / Salchicha:
- ${c('pancho_corto_check')} Corto / Viena. Paquetes de: ${v('pancho_corto_uni')} uni. Precio venta sugerido: $${v('pancho_corto_precio')} por paquete.
- ${c('pancho_largo_check')} Largo / Súper Pancho. Paquetes de: ${v('pancho_largo_uni')} uni. Precio venta sugerido: $${v('pancho_largo_precio')} por paquete.
${getDynamicPancho()}
${getAclaracion('2. Panes de Pancho')}

3. Vida útil del producto:
- ¿Cuántos días dura el producto envasado antes de su vencimiento?: ${v('vida_util_dias')} días.
${getAclaracion('3. Vida útil')}

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
- Bolsas de Empaque y Precintos: ${v('insumo_bolsas_pres')} (Costo: ${v('insumo_bolsas_costo')})
${getDynamicInsumo() ? getDynamicInsumo() : ""}

**Stock Mínimo de Alerta:**
- ¿Con cuántas bolsas de harina restantes en depósito consideran que están en "Stock Crítico"?: ${v('stock_critico_bolsas')} bolsas.
${getAclaracion('Stock Mínimo de Alerta')}

---

### SECCIÓN 3: Recetas y Rendimiento Teórico (El Amasijo)
Tomando como base su tanda/amasijo estándar.

1. Tamaño del amasijo estándar:
- Normalmente, prenden la amasadora utilizando ${v('amasijo_harina_kg')} Kg de harina por tanda.
- ¿Cuántos litros de agua le agregan aproximadamente a esa tanda estándar de harina? ${v('amasijo_agua_litros')} Litros.
${getAclaracion('1. Tamaño del amasijo')}

2. Peso de corte (Bolladora / Cortadora):
- ¿De cuántos gramos cortan el bollo crudo para la hamburguesa? ${v('peso_hamburguesa_gramos')} gramos.
- ¿De cuántos gramos cortan el bollo crudo para el pancho? ${v('peso_pancho_gramos')} gramos.
${getAclaracion('2. Peso de corte')}

3. Rendimiento esperado en un día perfecto:
- Tanda de Hamburguesa: deberían salir ${v('rend_hamburguesa_paquetes')} paquetes terminados.
- Tanda de Pancho: deberían salir ${v('rend_pancho_paquetes')} paquetes terminados.
${getAclaracion('3. Rendimiento esperado')}

---

### SECCIÓN 4: Operativa en Planta (Carros y Bandejas)
Para la calculadora rápida de la aplicación.

1. Capacidad de las bandejas:
- ¿Cuántos panes de hamburguesa entran en una bandeja?: ${v('bandeja_hamburguesa_uni')} uni.
- ¿Cuántos panes de pancho entran en una bandeja?: ${v('bandeja_pancho_uni')} uni.
${getAclaracion('1. Capacidad de las bandejas')}

2. Capacidad de los carros:
- ¿Cuántas bandejas entran en un carro completo?: ${v('carro_bandejas_num')} bandejas por carro.
${getAclaracion('2. Capacidad de los carros')}

---

### SECCIÓN 5: Mermas y Desperdicios
Cómo miden lo que se pierde durante la jornada.

1. Merma de Masa (Cruda):
¿Miden o pesan la masa que sobra/se descarta antes de hornear?
- ${c('merma_masa', 'Sí, la pesamos en Kilos')} Sí, la pesamos en Kilos.
- ${c('merma_masa', 'No la medimos')} No la medimos.
${getAclaracion('1. Merma de Masa')}

2. Merma de Producto Terminado (Cocido):
El pan quemado o deforme, ¿cómo lo contabilizan para descartarlo?
- ${c('merma_producto', 'Por unidad')} Por unidad (ej: "se tiraron 15 panes").
- ${c('merma_producto', 'Por bandejas')} Por bandejas (ej: "se quemó media bandeja").
- ${c('merma_producto', 'Por paquetes')} Por paquetes (ej: "se perdieron 3 paquetes").
${getAclaracion('2. Merma de Producto')}

3. Reciclaje:
El pan de descarte, ¿se reutiliza (ej. para pan rallado o venta secundaria)?
- ${c('reciclaje', 'Sí, se recupera parte del valor')} Sí, se recupera parte del valor ($${v('reciclaje_valor')} por kg/bolsa recuperada).
- ${c('reciclaje', 'No, se tira a la basura (pérdida total)')} No, se tira a la basura (pérdida total).
${getAclaracion('3. Reciclaje')}

---

### SECCIÓN 6: Costos y Ventas Diarias
1. Gastos diarios adicionales:
Además de la materia prima, ¿qué otros gastos cargan día a día para restar de la ganancia?
- ${c('gasto_ninguno')} Ninguno, solo materia prima.
- ${c('gasto_combustible')} Combustible / Fletes de entrega.
- ${c('gasto_servicios')} Servicios (Luz/Gas estimados por día).
- ${c('gasto_empleados')} Empleados / Jornales diarios.
${getDynamicGasto()}
${getAclaracion('1. Gastos diarios adicionales')}

2. Modalidad de Ventas y Cobros:
Al finalizar el día, ¿cómo registran las ventas?
- ${c('registro_ventas', 'Contamos los paquetes físicos entregados/vendidos')} Contamos los paquetes físicos entregados/vendidos.
- ${c('registro_ventas', 'Solo contamos el dinero ingresado en caja/banco')} Solo contamos el dinero ingresado en caja/banco.

¿Manejan clientes con Fiado / Cuenta Corriente (pago a 7 o 15 días)?
- ${c('fiado_cc', 'Sí, necesitamos registrar si la venta fue cobrada al contado o quedó pendiente')} Sí, necesitamos registrar si la venta fue cobrada al contado o quedó pendiente.
- ${c('fiado_cc', 'No, todo se cobra en el día')} No, todo se cobra en el día.
${getAclaracion('2. Modalidad de Ventas')}

---

### SECCIÓN 7: Uso de la App e Infraestructura en Planta
1. Turnos de producción:
- ¿Cuántos turnos trabajan por día? ${v('turnos_cantidad')} turnos (Mañana, Tarde, Noche).
${getAclaracion('1. Turnos de producción')}

2. Usuario principal:
¿Quién cargará los datos en la app durante el trabajo?
- ${c('usuario_principal', 'Maestro panadero / Cuadrero')} Maestro panadero / Cuadrero.
- ${c('usuario_principal', 'Encargado de turno / Supervisor')} Encargado de turno / Supervisor.
- ${c('usuario_principal', 'El dueño de la planta')} El dueño de la planta.
${getAclaracion('2. Usuario principal')}

3. Dispositivo de uso:
¿En qué tipo de dispositivo se usará la aplicación principalmente?
- ${c('dispositivo', 'Celular Android estándar')} Celular Android estándar.
- ${c('dispositivo', 'Celular antiguo / lento')} Celular antiguo/lento.
- ${c('dispositivo', 'Tablet')} Tablet.
- ${c('dispositivo', 'iPhone')} iPhone.
${getAclaracion('3. Dispositivo de uso')}

4. Conectividad en la Planta:
¿Hay buena señal de Wi-Fi en la zona de amasado/hornos donde se usará el dispositivo?
- ${c('wifi_planta', 'Sí')} Sí.
- ${c('wifi_planta', 'No')} No.
${getAclaracion('4. Conectividad en la Planta')}
`;
  }

  function showToast(message, type = "success") {
    toast.innerText = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  form.addEventListener("input", updateProgress);
  form.addEventListener("change", updateProgress);

  btnClear.addEventListener("click", () => {
    if(confirm("¿Estás seguro de borrar todos los datos ingresados?")) {
      form.reset();
      updateProgress();
      document.querySelectorAll('.sub-fields').forEach(el => {
        el.classList.add('disabled');
        el.style.display = 'none';
      });
      document.querySelectorAll('.aclaracion-text').forEach(el => {
        el.classList.add('hidden');
      });
      // Remover dinamicos extra (opcional pero lo dejamos simple recargando)
      location.reload();
    }
  });

  btnCopy.addEventListener("click", () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md).then(() => {
      showToast("¡Respuestas copiadas al portapapeles!", "success");
    }).catch(err => {
      console.error('Error al copiar:', err);
      showToast("Error al copiar. Tu navegador no lo permite.", "error");
    });
  });

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

  btnSend.addEventListener("click", async () => {
    if (WEB3FORMS_ACCESS_KEY === "TU_ACCESS_KEY_AQUI") {
      alert("ATENCIÓN: Debes colocar tu Access Key en config.js para usar esta función.");
      return;
    }

    const originalText = btnSend.innerHTML;
    btnSend.innerHTML = `<span class="btn-icon">⏳</span> Enviando...`;
    btnSend.disabled = true;

    const md = generateMarkdown();
    
    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: "Nueva Respuesta: Relevamiento Operativo Panadería",
      from_name: "Cuestionario Web",
      Mensaje_Markdown: md 
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.status === 200) {
        showToast("¡Enviado exitosamente a tu correo!", "success");
      } else {
        console.error(result);
        showToast("Hubo un error al enviar.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error de conexión.", "error");
    } finally {
      btnSend.innerHTML = originalText;
      btnSend.disabled = false;
    }
  });

  bindDynamicEvents();
  updateProgress();
});
