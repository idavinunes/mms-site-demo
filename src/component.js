
class Component extends DCLogic {
  state = {
    page: 'home',
    simMode: 'novo',      // novo | reduzir
    simBenefit: 'INSS',   // INSS | Federal
    simValor: 5000,
    simPrazo: 60,
    simSaldo: 18000,
    simCurParcela: 600,
    openFaq: 0,
    fName: '', fPhone: '', fTipo: 'Aposentado(a) INSS', fMsg: ''
  };

  go(page) {
    this.setState({ page });
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const mn = document.querySelector('main');
        if (mn && mn.animate) mn.animate(
          [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 420, easing: 'ease' }
        );
      }));
    }
  }

  rate() { return this.state.simBenefit === 'INSS' ? 0.0166 : 0.0150; }

  pmt(pv, n) {
    const i = this.rate();
    return pv * i / (1 - Math.pow(1 + i, -n));
  }

  brl(n, cents) {
    if (n == null || isNaN(n)) n = 0;
    return 'R$ ' + Number(n).toLocaleString('pt-BR', {
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0
    });
  }

  componentDidMount() {
    if (typeof window === 'undefined') return;
    this._io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; e.target.removeAttribute('data-fx-hidden'); this._io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    this._io2 = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { this._countUp(e.target); this._io2.unobserve(e.target); } });
    }, { threshold: 0.5 });
    this._onScroll = () => {
      const hd = document.querySelector('header'); if (!hd) return;
      const inner = hd.firstElementChild; const img = hd.querySelector('img');
      const s = window.scrollY > 24;
      if (inner) { inner.style.transition = 'padding .25s ease'; inner.style.paddingTop = s ? '4px' : '8px'; inner.style.paddingBottom = s ? '4px' : '8px'; }
      if (img) { img.style.transition = 'height .25s ease'; img.style.height = s ? '28px' : '34px'; }
      hd.style.boxShadow = s ? '0 6px 24px -8px rgba(0,0,0,.6)' : '0 4px 20px -8px rgba(0,0,0,.5)';
    };
    window.addEventListener('scroll', this._onScroll, { passive: true });
    this._fxTimer = setTimeout(() => {
      document.querySelectorAll('[data-fx-hidden]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; el.removeAttribute('data-fx-hidden'); });
    }, 1700);
    this._setupFx();
  }

  componentDidUpdate() { this._setupFx(); }

  componentWillUnmount() {
    if (this._io) this._io.disconnect();
    if (this._io2) this._io2.disconnect();
    if (this._onScroll) window.removeEventListener('scroll', this._onScroll);
    if (this._fxTimer) clearTimeout(this._fxTimer);
  }

  _countUp(el) {
    const target = parseFloat(el.dataset.count); if (isNaN(target)) return;
    const prefix = el.dataset.prefix || ''; const suffix = el.dataset.suffix || '';
    const dur = 1100; const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _setupFx() {
    if (typeof window === 'undefined' || !this._io) return;
    // subtle button hover
    document.querySelectorAll('a[target="_blank"], [data-fx-btn]').forEach(el => {
      if (el.__fxBound) return; el.__fxBound = true;
      el.addEventListener('mouseenter', () => { el.style.transition = 'transform .18s ease, filter .18s ease'; el.style.transform = 'translateY(-2px)'; el.style.filter = 'brightness(1.06)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; el.style.filter = ''; });
    });
    // scroll reveal for sections
    document.querySelectorAll('section').forEach(el => {
      if (el.dataset.fxR) return; el.dataset.fxR = '1';
      el.style.transition = 'opacity .7s ease, transform .7s ease';
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) {
        el.style.opacity = '0'; el.style.transform = 'translateY(14px)';
        requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; }));
      } else {
        el.style.opacity = '0'; el.style.transform = 'translateY(28px)'; el.setAttribute('data-fx-hidden', '1'); this._io.observe(el);
      }
    });
    // count-up
    document.querySelectorAll('[data-count]').forEach(el => { if (el.dataset.fxC) return; el.dataset.fxC = '1'; this._io2.observe(el); });
  }

  renderVals() {
    const s = this.state;
    const phone = this.props.phone ?? '(00) 00000-0000';
    const tel0800 = this.props.tel0800 ?? '0800 042 0229';
    const email = this.props.email ?? 'contato@mmsconsignados.com.br';
    const waDigits = (this.props.whatsapp ?? '5500000000000').replace(/\D/g, '');
    const wa = (msg) => 'https://wa.me/' + waDigits + (msg ? '?text=' + encodeURIComponent(msg) : '');

    const n = +s.simPrazo;
    const isNovo = s.simMode === 'novo';
    const parcela = isNovo ? this.pmt(+s.simValor, n) : this.pmt(+s.simSaldo, n);
    const total = parcela * n;
    const economia = Math.max(0, (+s.simCurParcela) - parcela);

    const sel = (active) => ({
      bg: active ? '#102C54' : '#eef2f7',
      color: active ? '#fff' : '#7a8699'
    });
    const inss = sel(s.simBenefit === 'INSS');
    const fed = sel(s.simBenefit === 'Federal');
    const mNovo = sel(s.simMode === 'novo');
    const mRed = sel(s.simMode === 'reduzir');

    const faqRaw = [
      ['Quem pode contratar o empréstimo consignado?', 'Aposentados e pensionistas do INSS e servidores públicos federais com margem disponível no benefício ou contracheque. A gente verifica sua margem gratuitamente.'],
      ['O desconto vem direto do meu benefício?', 'Sim. No consignado, a parcela é descontada automaticamente do seu benefício ou salário, o que garante as menores taxas e mais segurança para você.'],
      ['Como funciona a redução de parcelas?', 'Analisamos seus contratos atuais e negociamos diretamente com o banco, geralmente por meio de refinanciamento, para diminuir o valor que você paga todo mês.'],
      ['Preciso pagar alguma coisa pela consultoria?', 'Não. A análise e a orientação da MMS são gratuitas. Você só assume o contrato se as condições forem boas para você.'],
      ['Em quanto tempo recebo um retorno?', 'Nosso compromisso é responder em até 24 horas. Muitas vezes o retorno acontece no mesmo dia do contato.'],
      ['A MMS é confiável?', 'Sim. Respondemos 100% das manifestações no Reclame Aqui e mantemos uma central de SAC dedicada a resolver qualquer questão do início ao fim.']
    ];
    const faqItems = faqRaw.map((f, i) => ({
      q: f[0], a: f[1],
      open: s.openFaq === i,
      sign: s.openFaq === i ? '−' : '+',
      toggle: () => this.setState({ openFaq: s.openFaq === i ? -1 : i })
    }));

    const simMsg = isNovo
      ? `Olá! Simulei um empréstimo de ${this.brl(s.simValor)} em ${n}x (${s.simBenefit}), parcela estimada de ${this.brl(parcela, true)}. Gostaria de saber mais.`
      : `Olá! Quero reduzir minha parcela. Hoje pago ${this.brl(s.simCurParcela, true)} sobre um saldo de ${this.brl(s.simSaldo)} (${s.simBenefit}). Pode me ajudar?`;
    const formMsg = `Olá! Meu nome é ${s.fName || '[nome]'}. Sou ${s.fTipo}. Telefone: ${s.fPhone || '[telefone]'}. ${s.fMsg ? 'Mensagem: ' + s.fMsg : ''}`;

    return {
      isHome: s.page === 'home',
      isServicos: s.page === 'servicos',
      isSobre: s.page === 'sobre',
      isSimulador: s.page === 'simulador',
      isContato: s.page === 'contato',
      isFaq: s.page === 'faq',

      goHome: () => this.go('home'),
      goServicos: () => this.go('servicos'),
      goSobre: () => this.go('sobre'),
      goSimulador: () => this.go('simulador'),
      goContato: () => this.go('contato'),
      goFaq: () => this.go('faq'),

      phone, email, tel0800,
      tel0800Link: 'tel:+55' + tel0800.replace(/\D/g, ''),
      waLink: wa('Olá! Gostaria de uma consultoria sobre crédito consignado.'),
      waLinkSim: wa(simMsg),
      waLinkForm: wa(formMsg),
      mailLink: 'mailto:' + email,

      isNovo, isReduzir: !isNovo,
      simValor: s.simValor, simPrazo: String(s.simPrazo), simSaldo: s.simSaldo, simCurParcela: s.simCurParcela,
      valorFmt: this.brl(s.simValor),
      saldoFmt: this.brl(s.simSaldo),
      curParcelaFmt: this.brl(s.simCurParcela, true),
      parcelaFmt: this.brl(parcela, true),
      totalFmt: this.brl(total, true),
      economiaFmt: this.brl(economia, true),

      inssBg: inss.bg, inssColor: inss.color,
      federalBg: fed.bg, federalColor: fed.color,
      modeNovoBg: mNovo.bg, modeNovoColor: mNovo.color,
      modeReduzirBg: mRed.bg, modeReduzirColor: mRed.color,

      setBenefitINSS: () => this.setState({ simBenefit: 'INSS' }),
      setBenefitFederal: () => this.setState({ simBenefit: 'Federal' }),
      setModeNovo: () => this.setState({ simMode: 'novo' }),
      setModeReduzir: () => this.setState({ simMode: 'reduzir' }),
      onValor: (e) => this.setState({ simValor: +e.target.value }),
      onPrazo: (e) => this.setState({ simPrazo: +e.target.value }),
      onSaldo: (e) => this.setState({ simSaldo: +e.target.value }),
      onCurParcela: (e) => this.setState({ simCurParcela: +e.target.value }),

      faqItems,

      fName: s.fName, fPhone: s.fPhone, fTipo: s.fTipo, fMsg: s.fMsg,
      onFName: (e) => this.setState({ fName: e.target.value }),
      onFPhone: (e) => this.setState({ fPhone: e.target.value }),
      onFTipo: (e) => this.setState({ fTipo: e.target.value }),
      onFMsg: (e) => this.setState({ fMsg: e.target.value })
    };
  }
}
