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
    // Toggles de checkboxes
    container.querySelectorAll(".toggle-inputs").forEach(input => {
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
        }
        updateProgress();
      });
    });

    // Toggles de radios
    container.querySelectorAll("input[type='radio']").forEach(radio => {
      if(radio.dataset.radioBound) return;
      radio.dataset.radioBound = true;

      // Permitir desmarcar (uncheck) un Radio Button al volver a hacer clic en él
      radio.addEventListener("click", function(e) {
        const name = this.name;
        if (this.previousState === true) {
          this.checked = false;
          document.querySelectorAll(`input[name="${name}"]`).forEach(r => r.previousState = false);
          this.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
          document.querySelectorAll(`input[name="${name}"]`).forEach(r => r.previousState = false);
          this.previousState = true;
        }
      });

      radio.addEventListener("change", (e) => {
        const name = e.target.name;
        const allRadiosInGroup = document.querySelectorAll(`input[name="${name}"]`);
        allRadiosInGroup.forEach(r => {
          if(r.dataset.target) {
            const div = document.getElementById(r.dataset.target);
            if(div) {
              if (r.checked) {
                div.classList.remove("disabled");
                div.style.display = "flex";
              } else {
                div.classList.add("disabled");
                div.style.display = "none";
                div.querySelectorAll("input").forEach(i => i.value = "");
              }
            }
          }
        });
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
    const container = document.getElementById(`grid-${type}`) || document.getElementById(`dynamic-${type}`);
    if(!container) return;
    const count = parseInt(container.dataset.count);
    const newCount = count + 1;
    container.dataset.count = newCount;

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
      return;
    }

    const newItem = document.createElement('div');
    
    if(!isGasto) {
      newItem.className = "option-card dynamic-item";
      newItem.innerHTML = `
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
            <div class="input-with-suffix compact">
              <input type="number" name="${type}_otro_uni_${count}" placeholder="ej: 4 o 6" min="1">
              <span class="suffix">uni</span>
            </div>
          </div>
          <div class="input-inline">
            <label>Precio:</label>
            <div class="input-with-prefix">
              <span class="prefix">$</span>
              <input type="number" name="${type}_otro_precio_${count}" placeholder="0.00" step="0.01">
            </div>
          </div>
        </div>
      `;
    } else {
      newItem.className = "option-card full-width dynamic-item";
      newItem.innerHTML = `
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
    
    container.appendChild(newItem);
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
        navItems.forEach(item => item.classList.remove("active"));
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

  const getAclaracion = (searchString) => {
    const headers = document.querySelectorAll('h3, .hint');
    let targetGroup = null;
    headers.forEach(h => {
      if(h.innerText.includes(searchString)) {
        targetGroup = h.closest('.question-group');
      }
    });
    if(!targetGroup) {
      const labels = document.querySelectorAll('label');
      labels.forEach(l => {
        if(l.innerText.includes(searchString)) targetGroup = l.closest('.question-group');
      });
    }

    if(targetGroup) {
      const txt = targetGroup.querySelector('.aclaracion-text');
      if(txt && txt.value.trim() !== "") {
        return `\n> *Aclaración:* ${txt.value.trim()}\n`;
      }
    }
    return "";
  };

  const getDynamicHamb = () => {
    let str = "";
    const container = document.getElementById('dynamic-hamb');
    if(!container) return "";
    const count = parseInt(container.dataset.count);
    for(let i=0; i<count; i++) {
      if(form.elements[`hamb_otro_check_${i}`]) {
        str += `\n- ${c(`hamb_otro_check_${i}`)} Otro: ${v(`hamb_otro_nombre_${i}`)}. Paquetes de: ${v(`hamb_otro_uni_${i}`)} uni. Precio: $${v(`hamb_otro_precio_${i}`)}`;
      }
    }
    return str;
  };

  const getDynamicPancho = () => {
    let str = "";
    const container = document.getElementById('dynamic-pancho');
    if(!container) return "";
    const count = parseInt(container.dataset.count);
    for(let i=0; i<count; i++) {
      if(form.elements[`pancho_otro_check_${i}`]) {
        str += `\n- ${c(`pancho_otro_check_${i}`)} Otro: ${v(`pancho_otro_nombre_${i}`)}. Paquetes de: ${v(`pancho_otro_uni_${i}`)} uni. Precio: $${v(`pancho_otro_precio_${i}`)}`;
      }
    }
    return str;
  };

  const getDynamicInsumo = () => {
    let str = "";
    const container = document.getElementById('dynamic-insumo');
    if(!container) return "";
    const count = parseInt(container.dataset.count);
    for(let i=0; i<count; i++) {
      if(form.elements[`insumo_nombre_${i}`]) {
        str += `\n- ${v(`insumo_nombre_${i}`)}: ${v(`insumo_pres_${i}`)} (Costo: $${v(`insumo_costo_${i}`)})`;
      }
    }
    return str;
  };

  const getDynamicGasto = () => {
    let str = "";
    const container = document.getElementById('dynamic-gasto');
    if(!container) return "";
    const count = parseInt(container.dataset.count);
    for(let i=0; i<count; i++) {
      if(form.elements[`gasto_otros_check_${i}`]) {
        str += `\n- ${c(`gasto_otros_check_${i}`)} Otros: ${v(`gasto_otros_detalle_${i}`)}`;
      }
    }
    return str;
  };

  const getDynamicEspecial = () => {
    let str = "";
    const container = document.getElementById('dynamic-especial');
    if(!container) return "";
    const count = parseInt(container.dataset.count);
    for(let i=0; i<count; i++) {
      if(form.elements[`especial_otro_check_${i}`]) {
        str += `\n- ${c(`especial_otro_check_${i}`)} Otra edición especial: ${v(`especial_otro_nombre_${i}`)}. Paquetes de: ${v(`especial_otro_uni_${i}`)} uni. Precio: $${v(`especial_otro_precio_${i}`)}`;
      }
    }
    return str;
  };

  // Generate Markdown (14 Secciones)
  function generateMarkdown() {
    return `Por favor, completá los espacios en blanco o marcá con una "X" según corresponda. Si alguna opción no se adapta a tu forma de trabajo, usá el espacio de "Aclaración" debajo de cada punto.

---

### SECCIÓN 1: Catálogo de Productos y Presentaciones
Para definir qué variedades fabrican, cómo las embolsan y a qué precio se venden.

1. Panes de Hamburguesa (Variedades permanentes y base):
- ${c('hamb_clasico_check')} Pan clásico de hamburguesa. Paquetes de: ${v('hamb_clasico_uni')} uni. Precio: $${v('hamb_clasico_precio')}
- ${c('hamb_sesamo_blanco_check')} Pan clásico con sésamo blanco ("Nube"). Paquetes de: ${v('hamb_sesamo_blanco_uni')} uni. Precio: $${v('hamb_sesamo_blanco_precio')}
- ${c('hamb_mix_sesamo_check')} Pan con mix de sésamo (multicolor). Paquetes de: ${v('hamb_mix_sesamo_uni')} uni. Precio: $${v('hamb_mix_sesamo_precio')}
- ${c('hamb_mix_semillas_check')} Pan con mix de semillas. Paquetes de: ${v('hamb_mix_semillas_uni')} uni. Precio: $${v('hamb_mix_semillas_precio')}
- ${c('hamb_brioche_check')} Pan Brioche. Paquetes de: ${v('hamb_brioche_uni')} uni. Precio: $${v('hamb_brioche_precio')}
- ${c('hamb_papa_check')} Pan de Papa. Paquetes de: ${v('hamb_papa_uni')} uni. Precio: $${v('hamb_papa_precio')}
- ${c('hamb_sliders_check')} Sliders (pan cuadrado mini para burger). Paquetes de: ${v('hamb_sliders_uni')} uni. Precio: $${v('hamb_sliders_precio')}${getDynamicHamb()}

${getAclaracion('1. Panes de Hamburguesa')}
2. Panes de Pancho / Hot Dog:
- ${c('pancho_artesanal_check')} Pan para pancho / hot dog artesanal. Paquetes de: ${v('pancho_artesanal_uni')} uni. Precio: $${v('pancho_artesanal_precio')}
- ${c('pancho_corto_check')} Pancho Corto / Viena. Paquetes de: ${v('pancho_corto_uni')} uni. Precio: $${v('pancho_corto_precio')}
- ${c('pancho_largo_check')} Pancho Largo / Súper Pancho. Paquetes de: ${v('pancho_largo_uni')} uni. Precio: $${v('pancho_largo_precio')}${getDynamicPancho()}

${getAclaracion('2. Panes de Pancho')}
3. Ediciones Especiales / Estacionales:
- ${c('especial_calabaza_check')} Pan de Calabaza 🎃 (Halloween). Paquetes de: ${v('especial_calabaza_uni')} uni. Precio: $${v('especial_calabaza_precio')}
- ${c('especial_negro_check')} Pan Negro artesanal 🖤 (Halloween). Paquetes de: ${v('especial_negro_uni')} uni. Precio: $${v('especial_negro_precio')}
- ${c('especial_navidad_check')} Panes navideños rojos y verdes 🎄 (Navidad). Paquetes de: ${v('especial_navidad_uni')} uni. Precio: $${v('especial_navidad_precio')}${getDynamicEspecial()}

${getAclaracion('3. Ediciones Especiales')}
4. Vida útil del producto:
- ¿Cuántos días dura el producto envasado en óptimas condiciones antes de vencer?: ${v('vida_util_dias')} días.

${getAclaracion('4. Vida útil')}
---

### SECCIÓN 2: Recetas y Rendimiento (El Amasijo)
Para la calculadora de rendimientos teóricos basados en su tanda estándar.

1. Tamaño del amasijo estándar:
- Normalmente, prenden la amasadora utilizando ${v('amasijo_harina_kg')} Kg de harina por tanda.
- ¿Cuántos litros de agua le agregan aproximadamente a esa tanda?: ${v('amasijo_agua_litros')} Litros.

${getAclaracion('1. Tamaño del amasijo')}
2. Peso de corte (Bolladora / Cortadora):
- Bollo crudo para hamburguesa: ${v('peso_hamburguesa_gramos')} gramos.
- Bollo crudo para pancho: ${v('peso_pancho_gramos')} gramos.

${getAclaracion('2. Peso de corte')}
3. Rendimiento esperado en un día perfecto:
- De una tanda estándar de hamburguesas deberían salir ${v('rend_hamburguesa_paquetes')} paquetes terminados.
- De una tanda estándar de panchos deberían salir ${v('rend_pancho_paquetes')} paquetes terminados.

${getAclaracion('3. Rendimiento esperado')}
---

### SECCIÓN 3: Capacidad Operativa (Carros y Bandejas)
Para los cálculos de horneado y estiba.

1. Capacidad de las bandejas (latas):
- ¿Cuántos panes de hamburguesa entran en una bandeja?: ${v('bandeja_hamburguesa_uni')} uni.
- ¿Cuántos panes de pancho entran en una bandeja?: ${v('bandeja_pancho_uni')} uni.

${getAclaracion('1. Capacidad de las bandejas')}
2. Capacidad de los carros:
- ¿Cuántas bandejas entran en un carro completo?: ${v('carro_bandejas_num')} bandejas.

${getAclaracion('2. Capacidad de los carros')}
---

### SECCIÓN 4: Turnos de Producción
Configuración de horarios y rotación de trabajo.

1. ¿Cuáles son los turnos que utilizan actualmente?
- ${c('turno_manana')} Mañana
- ${c('turno_tarde')} Tarde
- ${c('turno_noche')} Noche
- ${c('turno_otro_check')} Otros: ${v('turno_otro_detalle')}

2. ¿Los turnos deben mantenerse siempre como un conjunto fijo?
- ${c('turnos_fijos', 'Sí, serán siempre los mismos.')} Sí, serán siempre los mismos.
- ${c('turnos_fijos', 'No, pueden cambiar con el tiempo.')} No, pueden cambiar con el tiempo.

3. Si pueden cambiar, ¿quién debería poder modificar o administrar los turnos?
- ${c('turnos_admin', 'Dueño.')} Dueño.
- ${c('turnos_admin', 'Administrador.')} Administrador.
- ${c('turnos_admin', 'Supervisor.')} Supervisor.
- ${c('turnos_admin', 'Otro')} Otro: ${v('turnos_admin_detalle')}

4. Datos de los turnos (Horarios y nombres):
- Nombre del turno: ${v('turno_config_nombre')}
- Hora de inicio y fin: ${v('turno_config_horario')}

${getAclaracion('4. Datos de los turnos')}
---

### SECCIÓN 5: Materia Prima e Insumos Críticos
Para calcular el costo real, alertas de stock y trazabilidad de compras.

1. Presentación y Costo de Insumos Críticos:
(Indicar tamaño de compra, ej: Bolsa 50kg, Caja 10kg, Millar, y precio actual)
- Harina: ${v('insumo_harina_pres')} (Costo: $${v('insumo_harina_costo')})
- Levadura (Fresca / Seca): ${v('insumo_levadura_pres')} (Costo: $${v('insumo_levadura_costo')})
- Grasa / Margarina / Aceite: ${v('insumo_grasa_pres')} (Costo: $${v('insumo_grasa_costo')})
- Sésamo: ${v('insumo_sesamo_pres')} (Costo: $${v('insumo_sesamo_costo')})
- Aditivos / Mejoradores: ${v('insumo_aditivos_pres')} (Costo: $${v('insumo_aditivos_costo')})
- Azúcar: ${v('insumo_azucar_pres')} (Costo: $${v('insumo_azucar_costo')})
- Sal: ${v('insumo_sal_pres')} (Costo: $${v('insumo_sal_costo')})
- Bolsas / Precintos: ${v('insumo_bolsas_pres')} (Costo: $${v('insumo_bolsas_costo')})${getDynamicInsumo()}

2. Trazabilidad de Ingreso (Lotes y Vencimientos):
- ${c('trazabilidad_lotes', 'Sí, llevamos control estricto de qué lote usamos en cada amasijo.')} Sí, llevamos control estricto de qué lote usamos en cada amasijo.
- ${c('trazabilidad_lotes', "No, usamos el método 'lo primero que entra es lo primero que sale' a ojo.")} No, usamos el método "lo primero que entra es lo primero que sale" a ojo.

3. Alertas de Stock Mínimo:
- ¿Con cuántas bolsas de harina restantes en depósito consideran que están en "Stock Crítico"?: ${v('stock_critico_bolsas')} bolsas.

${getAclaracion('3. Alertas de Stock Mínimo')}
---

### SECCIÓN 6: Descuento de Materias Primas (FIFO / FEFO)
Reglas para determinar qué lote físico de insumo se consume al producir.

1. Cuando se utiliza una materia prima almacenada en varios lotes, ¿cómo debe decidir el sistema qué lote descontar?
- ${c('criterio_fifo_fefo', 'FIFO: utilizar primero el lote que ingresó primero al depósito.')} FIFO: utilizar primero el lote que ingresó primero al depósito.
- ${c('criterio_fifo_fefo', 'FEFO: utilizar primero el lote cuya fecha de vencimiento sea más próxima.')} FEFO: utilizar primero el lote cuya fecha de vencimiento sea más próxima.
- ${c('criterio_fifo_fefo', 'Selección manual: el operario elige en la tablet qué lote está utilizando.')} Selección manual: el operario elige en la tablet qué lote está utilizando.
- ${c('criterio_fifo_fefo', 'Otro criterio')} Otro criterio: ${v('criterio_fifo_detalle')}

2. Si se utiliza FIFO o FEFO y el lote seleccionado automáticamente no alcanza para cubrir todo el consumo:
- ${c('lote_insuficiente', 'Continuar automáticamente con el siguiente lote correspondiente.')} Continuar automáticamente con el siguiente lote correspondiente.
- ${c('lote_insuficiente', 'Solicitar al operario que seleccione el siguiente lote.')} Solicitar al operario que seleccione el siguiente lote.
- ${c('lote_insuficiente', 'No permitir registrar la producción hasta resolverlo.')} No permitir registrar la producción hasta resolverlo.

${getAclaracion('2. Lote seleccionado insuficiente')}
---

### SECCIÓN 7: Mermas, Desperdicios y Reciclaje
Para auditar las pérdidas de la jornada.

1. Merma de Masa (Cruda):
- ${c('merma_masa', 'Sí, la pesamos en Kilos.')} Sí, la pesamos en Kilos.
- ${c('merma_masa', 'No la medimos.')} No la medimos.

2. Merma de Producto Terminado (Cocido/Envasado):
- ${c('merma_producto', "Por unidad (ej: '15 panes').")} Por unidad (ej: "15 panes").
- ${c('merma_producto', "Por bandejas (ej: 'media bandeja').")} Por bandejas (ej: "media bandeja").
- ${c('merma_producto', "Por paquetes (ej: '3 paquetes').")} Por paquetes (ej: "3 paquetes").
- ${c('merma_producto', 'Otros motivos')} Otros motivos: ${v('merma_otros_detalle')}

3. Reciclaje y Recupero:
- ${c('reciclaje', 'Sí, recuperamos parte del valor')} Sí, recuperamos aprox. $${v('reciclaje_valor')} por kg/bolsa.
- ${c('reciclaje', 'No, se tira a la basura (pérdida total).')} No, se tira a la basura (pérdida total).

${getAclaracion('3. Reciclaje y Recupero')}
---

### SECCIÓN 8: Valorización Económica de Mermas
Criterios para traducir las mermas físicas a pérdida monetaria.

1. ¿Quieren que el sistema calcule también cuánto dinero representa la merma desperdiciada?
- ${c('valorizar_mermas', 'Sí.')} Sí.
- ${c('valorizar_mermas', 'No, solamente queremos registrar la cantidad de producto o materia prima desperdiciada.')} No, solamente queremos registrar la cantidad física desperdiciada.

2. Criterio de costo para calcular el valor monetario:
- ${c('criterio_costo_merma', 'Último costo registrado del insumo/producto.')} Último costo registrado del insumo/producto.
- ${c('criterio_costo_merma', 'Costo promedio ponderado.')} Costo promedio ponderado.

${getAclaracion('2. Criterio de costo')}
---

### SECCIÓN 9: Gastos Operativos, Ventas y Cobranzas
Para el registro comercial y la rentabilidad neta del día.

1. Gastos diarios adicionales:
- ${c('gasto_ninguno')} Ninguno, solo materia prima.
- ${c('gasto_combustible')} Combustible / Fletes de entrega.
- ${c('gasto_servicios')} Servicios (Luz/Gas estimados por día).
- ${c('gasto_empleados')} Empleados / Jornales diarios.${getDynamicGasto()}

2. Clientes Fijos y Mayoristas:
- ${c('clientes_mayoristas', 'Sí, necesitamos tener la agenda de clientes mayoristas cargada en la app.')} Sí, necesitamos tener la agenda de clientes mayoristas cargada en la app.
- ${c('clientes_mayoristas', 'No, vendemos a consumidor final o todos pagan el mismo precio estándar.')} No, vendemos a consumidor final o todos pagan el mismo precio estándar.

3. Cobranza y Cuentas Corrientes:
- ${c('fiado_cc', 'Sí, damos fiado / cuenta corriente (a 7, 15 días, etc.) y hay que registrarlo.')} Sí, damos fiado / cuenta corriente (a 7, 15 días, etc.) y hay que registrarlo.
- ${c('fiado_cc', 'No, todo se cobra al contado en el día.')} No, todo se cobra al contado en el día.

${getAclaracion('3. Cobranza y Cuentas Corrientes')}
---

### SECCIÓN 10: Pedidos, Estados y Reserva de Inventario
Gestión comercial y compromiso de stock.

1. Función de los pedidos:
- ${c('funcion_pedidos', 'Solo sirven como registro/información.')} Solo sirven como registro/información.
- ${c('funcion_pedidos', 'Sirven para reservar producción o stock.')} Sirven para reservar producción o stock.
- ${c('funcion_pedidos', 'Sirven para ambas cosas.')} Sirven para ambas cosas.

2. Momento de reserva de stock:
- ${c('reserva_momento', 'Nunca. El pedido es solamente informativo.')} Nunca. El pedido es solamente informativo.
- ${c('reserva_momento', 'Al crear el pedido.')} Al crear el pedido.
- ${c('reserva_momento', 'Al confirmar el pedido.')} Al confirmar el pedido.
- ${c('reserva_momento', 'Manualmente por un encargado.')} Manualmente por un encargado.

${getAclaracion('2. Momento de reserva')}
---

### SECCIÓN 11: Trazabilidad entre Ventas y Lotes de Producción
Asociación entre lo producido y lo vendido.

1. Historial de ventas por lote de producción:
- ${c('historial_lote_ventas', 'No mostrar ingresos de ventas en el historial de lote.')} No mostrar ingresos de ventas en el historial de lote.
- ${c('historial_lote_ventas', 'Mostrar parte de las ventas del día asignada proporcionalmente.')} Mostrar parte de las ventas del día asignada proporcionalmente.
- ${c('historial_lote_ventas', 'El vendedor indica opcionalmente desde qué lote vende.')} El vendedor indica opcionalmente desde qué lote vende.

${getAclaracion('1. Historial de ventas')}
---

### SECCIÓN 12: Uso de la App e Infraestructura en Planta
Dispositivos y calidad de conectividad.

1. Dispositivo principal:
- ${c('dispositivo', 'Tablet (Android / iPad).')} Tablet (Android / iPad).
- ${c('dispositivo', 'Celular del encargado.')} Celular del encargado.
- ${c('dispositivo', 'Computadora de escritorio / Notebook.')} Computadora de escritorio / Notebook.

2. Conectividad en Planta:
- ${c('wifi_planta', 'Sí, hay buena señal siempre.')} Sí, hay buena señal siempre.
- ${c('wifi_planta', 'No, la señal es mala (la app debe trabajar sin internet y sincronizar después).')} No, la señal es mala (la app debe trabajar sin internet y sincronizar después).

${getAclaracion('2. Conectividad')}
---

### SECCIÓN 13: Seguridad y Acceso mediante PIN
Seguridad y perfiles de usuario en tablets.

1. Uso compartido y requerimiento de PIN:
- ${c('requiere_pin', 'No, acceso libre.')} No, acceso libre.
- ${c('requiere_pin', 'Sí, solicitar PIN para funciones sensibles.')} Sí, solicitar PIN para funciones sensibles.

2. Roles y Privacidad:
- ${c('roles_privacidad', 'Puede ver todo (precios de costo, precios de venta, ganancias diarias).')} Puede ver todo (precios de costo, precios de venta, ganancias diarias).
- ${c('roles_privacidad', 'Solo debe ver lo operativo (recetas, cantidad a producir, registro de mermas), la plata debe estar oculta.')} Solo debe ver lo operativo (recetas, cantidad a producir, registro de mermas), la plata debe estar oculta.
- ${c('roles_privacidad', 'No la usará ningún operario, la aplicación la manejará exclusivamente el dueño.')} No la usará ningún operario, la aplicación la manejará exclusivamente el dueño.

${getAclaracion('2. Roles y Privacidad')}
---

### SECCIÓN 14: Aclaraciones Finales sobre Reglas Operativas
Reglas de negocio no escritas y observaciones generales.

1. Observaciones o reglas especiales que el sistema deba considerar:
${v('observaciones_finales')}
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
