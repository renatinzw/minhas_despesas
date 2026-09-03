let transacoes = [];

let grafico = null;

// =========================================

// ELEMENTOS

// =========================================

const form = document.getElementById("financialForm");

const tabela = document.getElementById("transacoesBody");

const filtroTipo = document.getElementById("filtroTipo");

const modal = document.getElementById("modal");

const fecharModal = document.getElementById("fecharModal");

const editForm = document.getElementById("editForm");

// =========================================

// FORMATAÇÃO DE MOEDA

// =========================================

function formatarMoeda(valor) {

    return Number(valor).toLocaleString("pt-BR", {

        style: "currency",

        currency: "BRL"

    });

}

// =========================================

// FORMATAÇÃO DE DATA

// =========================================

function formatarData(data) {

    if (!data) return "-";

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {

        return "-";

    }

    return dataObj.toLocaleDateString("pt-BR");

}

// =========================================

// ARMAZENAMENTO LOCAL

// =========================================

// O GitHub Pages não possui a API /api/transacoes.

// Por isso, as transações ficam salvas no navegador

// usando localStorage.

const CHAVE_STORAGE = "financas_facil_transacoes";

function salvarTransacoes() {

    localStorage.setItem(

        CHAVE_STORAGE,

        JSON.stringify(transacoes)

    );

}

// =========================================

// CARREGAR TRANSAÇÕES

// =========================================

function carregarTransacoes() {

    try {

        const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);

        if (!dadosSalvos) {

            transacoes = [];

        } else {

            const dados = JSON.parse(dadosSalvos);

            transacoes = Array.isArray(dados) ? dados : [];

        }

        atualizarInterface();

    } catch (erro) {

        console.error(erro);

        transacoes = [];

        atualizarInterface();

        alert("Não foi possível carregar as transações salvas.");

    }

}

// =========================================

// ADICIONAR TRANSAÇÃO

// =========================================

form.addEventListener("submit", function (event) {

    event.preventDefault();

    const dados = {

        id: Date.now().toString(),

        descricao:

            document.getElementById("descricao").value.trim(),

        valor:

            Number(

                document.getElementById("valor").value

            ),

        tipo:

            document.getElementById("tipo").value,

        categoria:

            document.getElementById("categoria").value,

        data: new Date().toISOString()

    };

    if (!dados.descricao || !dados.valor || dados.valor <= 0) {

        alert("Preencha a descrição e informe um valor válido.");

        return;

    }

    transacoes.push(dados);

    salvarTransacoes();

    form.reset();

    atualizarInterface();

});

// =========================================

// ATUALIZAR INTERFACE

// =========================================

function atualizarInterface() {

    atualizarTabela();

    atualizarTotais();

    atualizarGrafico();

}

// =========================================

// TABELA

// =========================================

function atualizarTabela() {

    tabela.innerHTML = "";

    const filtro = filtroTipo.value;

    const lista = transacoes.filter(transacao => {

        if (filtro === "todos") {

            return true;

        }

        return transacao.tipo === filtro;

    });

    if (lista.length === 0) {

        tabela.innerHTML = `

            <tr>

                <td colspan="6" style="text-align:center">

                    Nenhuma transação encontrada.

                </td>

            </tr>

        `;

        return;

    }

    lista.forEach(transacao => {

        const tr = document.createElement("tr");

        const data = document.createElement("td");

        data.textContent = formatarData(transacao.data);

        const descricao = document.createElement("td");

        descricao.textContent = transacao.descricao;

        const categoria = document.createElement("td");

        categoria.textContent = transacao.categoria;

        const tipo = document.createElement("td");

        tipo.textContent = transacao.tipo;

        tipo.className = "tipo";

        const valor = document.createElement("td");

        valor.textContent =

            `${transacao.tipo === "receita" ? "+" : "-"} ${formatarMoeda(transacao.valor)}`;

        valor.className =

            transacao.tipo === "receita"

                ? "valor-receita"

                : "valor-despesa";

        const acoes = document.createElement("td");

        const editar = document.createElement("button");

        editar.textContent = "Editar";

        editar.className = "btn-edit";

        editar.addEventListener("click", () => {

            abrirEdicao(transacao);

        });

        const excluir = document.createElement("button");

        excluir.textContent = "Excluir";

        excluir.className = "btn-delete";

        excluir.addEventListener("click", () => {

            excluirTransacao(transacao.id);

        });

        acoes.appendChild(editar);

        acoes.appendChild(excluir);

        tr.appendChild(data);

        tr.appendChild(descricao);

        tr.appendChild(categoria);

        tr.appendChild(tipo);

        tr.appendChild(valor);

        tr.appendChild(acoes);

        tabela.appendChild(tr);

    });

}

// =========================================

// TOTAIS

// =========================================

function atualizarTotais() {

    let receitas = 0;

    let despesas = 0;

    transacoes.forEach(transacao => {

        const valor = Number(transacao.valor);

        if (transacao.tipo === "receita") {

            receitas += valor;

        } else {

            despesas += valor;

        }

    });

    const saldo = receitas - despesas;

    document.getElementById(

        "totalReceitas"

    ).textContent = formatarMoeda(receitas);

    document.getElementById(

        "totalDespesas"

    ).textContent = formatarMoeda(despesas);

    const saldoElemento =

        document.getElementById("saldo");

    saldoElemento.textContent =

        formatarMoeda(saldo);

    saldoElemento.style.color =

        saldo >= 0

            ? "#16a34a"

            : "#dc2626";

}

// =========================================

// GRÁFICO

// =========================================

function atualizarGrafico() {

    const categorias = {};

    transacoes.forEach(transacao => {

        if (transacao.tipo !== "despesa") {

            return;

        }

        const categoria = transacao.categoria;

        categorias[categoria] =

            (categorias[categoria] || 0)

            + Number(transacao.valor);

    });

    const labels = Object.keys(categorias);

    const valores = Object.values(categorias);

    const canvas =

        document.getElementById("graficoDespesas");

    if (!canvas || typeof Chart === "undefined") {

        return;

    }

    if (grafico) {

        grafico.destroy();

        grafico = null;

    }

    if (labels.length === 0) {

        return;

    }

    grafico = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [{

                data: valores,

                backgroundColor: [

                    "#2563eb",

                    "#16a34a",

                    "#f59e0b",

                    "#dc2626",

                    "#8b5cf6",

                    "#06b6d4",

                    "#64748b"

                ],

                borderWidth: 0

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}

// =========================================

// EXCLUIR

// =========================================

function excluirTransacao(id) {

    const confirmar =

        confirm(

            "Deseja realmente excluir esta transação?"

        );

    if (!confirmar) {

        return;

    }

    transacoes =

        transacoes.filter(transacao => {

            return String(transacao.id) !== String(id);

        });

    salvarTransacoes();

    atualizarInterface();

}

// =========================================

// ABRIR EDIÇÃO

// =========================================

function abrirEdicao(transacao) {

    document.getElementById(

        "editId"

    ).value = transacao.id;

    document.getElementById(

        "editDescricao"

    ).value = transacao.descricao;

    document.getElementById(

        "editValor"

    ).value = transacao.valor;

    document.getElementById(

        "editTipo"

    ).value = transacao.tipo;

    document.getElementById(

        "editCategoria"

    ).value = transacao.categoria;

    modal.classList.remove("hidden");

}

// =========================================

// FECHAR MODAL

// =========================================

fecharModal.addEventListener(

    "click",

    () => {

        modal.classList.add("hidden");

    }

);

modal.addEventListener(

    "click",

    event => {

        if (event.target === modal) {

            modal.classList.add("hidden");

        }

    }

);

// =========================================

// SALVAR EDIÇÃO

// =========================================

editForm.addEventListener(

    "submit",

    function (event) {

        event.preventDefault();

        const id =

            document.getElementById(

                "editId"

            ).value;

        const dados = {

            descricao:

                document.getElementById(

                    "editDescricao"

                ).value.trim(),

            valor:

                Number(

                    document.getElementById(

                        "editValor"

                    ).value

                ),

            tipo:

                document.getElementById(

                    "editTipo"

                ).value,

            categoria:

                document.getElementById(

                    "editCategoria"

                ).value

        };

        if (!dados.descricao || !dados.valor || dados.valor <= 0) {

            alert("Preencha a descrição e informe um valor válido.");

            return;

        }

        const indice =

            transacoes.findIndex(

                transacao =>

                    String(transacao.id) === String(id)

            );

        if (indice === -1) {

            alert("Transação não encontrada.");

            return;

        }

        transacoes[indice] = {

            ...transacoes[indice],

            ...dados

        };

        salvarTransacoes();

        modal.classList.add("hidden");

        atualizarInterface();

    }

);

// =========================================

// FILTRO

// =========================================

filtroTipo.addEventListener(

    "change",

    atualizarTabela

);

// =========================================

// INICIALIZAÇÃO

// =========================================

carregarTransacoes();
