import React, { useState, useEffect } from 'react';
import { LogIn, Mail, Lock, User, AlertCircle, Sparkles, ExternalLink, ShieldCheck, UserCheck, Phone, Check, X, Eye, EyeOff, CheckCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithGoogle, signInWithFacebook, signInWithApple, auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

// Password strength and validation helper
interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  color: string;
  textColor: string;
  suggestions: { text: string; satisfied: boolean }[];
}

const getPasswordStrength = (password: string): PasswordStrength => {
  const suggestions = [
    { text: 'Mínimo de 6 caracteres', satisfied: password.length >= 6 },
    { text: 'Pelo menos uma letra maiúscula', satisfied: /[A-Z]/.test(password) },
    { text: 'Pelo menos um número', satisfied: /[0-9]/.test(password) },
    { text: 'Pelo menos um caractere especial (ex: @, #, $)', satisfied: /[^A-Za-z0-9]/.test(password) }
  ];

  const satisfiedCount = suggestions.filter(s => s.satisfied).length;
  let score = satisfiedCount;

  const levels = [
    { label: 'Muito Fraca 🔴', color: 'bg-red-400', textColor: 'text-red-500' },
    { label: 'Fraca 🟧', color: 'bg-orange-400', textColor: 'text-orange-500' },
    { label: 'Média 🟨', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
    { label: 'Forte 🟩', color: 'bg-green-400', textColor: 'text-green-500' },
    { label: 'Excelente 💪🚀', color: 'bg-emerald-500', textColor: 'text-emerald-600' }
  ];

  const currentLevel = levels[score];

  return {
    score,
    label: currentLevel.label,
    color: currentLevel.color,
    textColor: currentLevel.textColor,
    suggestions
  };
};

const formatPhone = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 3) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  }
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
};

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);

  const [whatsappVerified, setWhatsappVerified] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [sendingCode, setSendingCode] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [userInputCode, setUserInputCode] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const handleSendCode = async () => {
    const clean = phoneInput.trim();
    const digits = clean.replace(/[^\d]/g, '');
    if (digits.length < 10) {
      setVerificationError("Por favor, digite um número de WhatsApp válido.");
      return;
    }

    setSendingCode(true);
    setVerificationError(null);

    try {
      // Check if phone number is already registered inside Firebase first
      const phoneDocRef = doc(db, 'phones', clean);
      let phoneSnap;
      try {
        phoneSnap = await getDoc(phoneDocRef);
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.GET, `phones/${clean}`);
        throw dbErr;
      }
      if (phoneSnap.exists()) {
        setVerificationError("Este número de telefone já está cadastrado em outra conta do Avalia-me.");
        setSendingCode(false);
        return;
      }

      // Generate a random 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setCodeSent(true);
    } catch (err: any) {
      console.error(err);
      setVerificationError("Erro ao verificar número do telefone no servidor. Prossiga ou tente novamente.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = () => {
    if (userInputCode === generatedCode) {
      setWhatsappVerified(true);
      setVerificationError(null);
    } else {
      setVerificationError("Código inválido. Por favor, verifique o código de simulação gerado.");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');
    setIsNetworkError(false);
    setIsOperationNotAllowed(false);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('O login com Google não está ativo no Console do Firebase de seu projeto. Para ativar: Vá no Console do Firebase > Authentication > Sign-in Method > Adicionar novo provedor > Ativar o provedor "Google".');
      } else if (error.code === 'auth/network-request-failed' || error.message?.includes('network-request-failed')) {
        setIsNetworkError(true);
        setErrorMsg('Erro de rede (auth/network-request-failed): Domínio não autorizado ou popups bloqueados no iframe. Use logins por E-mail, use abaixo as "Contas de Teste Rápido" ou clique em "Abrir no Navegador" no canto superior.');
      } else {
        setErrorMsg(error.message || 'Erro ao entrar com Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');
    setIsNetworkError(false);
    setIsOperationNotAllowed(false);
    try {
      await signInWithFacebook();
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('O login com Facebook não está ativo no Console do Firebase de seu projeto. Para ativar: Vá no Console do Firebase > Authentication > Sign-in Method > Adicionar novo provedor > Ativar o provedor "Facebook".');
      } else if (error.code === 'auth/network-request-failed' || error.message?.includes('network-request-failed')) {
        setIsNetworkError(true);
        setErrorMsg('Erro de rede (auth/network-request-failed): Popup ou rede bloqueada pelo iframe. Use E-mail.');
      } else {
        setErrorMsg(error.message || 'Erro ao entrar com Facebook.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');
    setIsNetworkError(false);
    setIsOperationNotAllowed(false);
    try {
      await signInWithApple();
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('O login com Apple ainda não está ativo no Console do Firebase de seu projeto. Para ativar: Vá no Console do Firebase > Authentication > Sign-in Method > Adicionar novo provedor > Ativar o provedor "Apple" com suas credenciais de desenvolvedor da Apple.');
      } else if (error.code === 'auth/network-request-failed' || error.message?.includes('network-request-failed')) {
        setIsNetworkError(true);
        setErrorMsg('Erro de rede (auth/network-request-failed): Login da Apple bloqueado pelo iframe. Use E-mail ou abra em Nova Aba.');
      } else {
        setErrorMsg(error.message || 'Erro ao entrar com a Apple.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || (isRegister && (!nameInput || !phoneInput || !confirmPasswordInput))) {
      setErrorMsg('Por favor, preencha todos os campos necessários.');
      return;
    }

    if (isRegister) {
      if (passwordInput !== confirmPasswordInput) {
        setErrorMsg('As senhas digitadas não coincidem. Por favor, confira e repita a mesma senha.');
        return;
      }
      
      const strength = getPasswordStrength(passwordInput);
      if (strength.score < 2) {
        setErrorMsg('Para sua segurança, crie uma senha mais forte (satisfaça pelo menos 2 requisitos listados abaixo).');
        return;
      }

      const cleanPhone = phoneInput.replace(/[^\d]/g, '');
      if (cleanPhone.length < 10) {
        setErrorMsg('Por favor, informe um número de telefone celular válido com DDD.');
        return;
      }

      if (!whatsappVerified) {
        setErrorMsg('A validação do seu WhatsApp por mensagem é obrigatória para realizar o cadastro.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');
    setIsNetworkError(false);
    setIsOperationNotAllowed(false);
    try {
      if (isRegister) {
        setStatusMsg('Criando sua conta credenciada...');
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        const user = userCredential.user;

        setStatusMsg('Validando número de telefone...');
        const cleanPhone = phoneInput.trim();
        const phoneDocRef = doc(db, 'phones', cleanPhone);
        
        let phoneSnap;
        try {
          phoneSnap = await getDoc(phoneDocRef);
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.GET, `phones/${cleanPhone}`);
          throw dbErr;
        }

        if (phoneSnap.exists()) {
          setStatusMsg('Número de telefone já cadastrado. Revertendo...');
          await user.delete();
          setErrorMsg('Este número de telefone já está cadastrado em outra conta do Avalia-me.');
          setLoading(false);
          return;
        }

        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=U&backgroundColor=ccd9ff`;
        
        await updateProfile(user, {
          displayName: nameInput,
          photoURL: avatarUrl
        });
        
        setStatusMsg('Finalizando cadastro...');

        // Register immediate phone registry document
        try {
          await setDoc(phoneDocRef, {
            userId: user.uid,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.WRITE, `phones/${cleanPhone}`);
          throw dbErr;
        }

        // Register immediate database user node
        const userDocRef = doc(db, 'users', user.uid);
        try {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: nameInput.trim(),
            email: emailInput.trim().toLowerCase(),
            phone: phoneInput.trim(),
            photoURL: avatarUrl,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}`);
          throw dbErr;
        }
        setStatusMsg('Tudo pronto! Entrando...');
      } else {
        setStatusMsg('Autenticando...');
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('O login/registro com E-mail e Senha não está ativo no Console do Firebase de seu projeto. Para ativar: Vá no Console do Firebase > Authentication > Sign-in Method > E-mail/Senha > Ativar e clique em Salvar.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está sendo utilizado por outro usuário.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('A senha precisa conter no mínimo 6 caracteres.');
      } else if (err.code === 'auth/network-request-failed') {
        setIsNetworkError(true);
        setErrorMsg('Erro de rede (auth/network-request-failed). Tente usar uma nova guia ou verifique sua conexão.');
      } else {
        setErrorMsg(err.message || 'Tente novamente em instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'cliente' | 'prestador') => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');
    setIsNetworkError(false);
    setIsOperationNotAllowed(false);
    
    const demoEmail = role === 'prestador' ? 'prestador.demo@avalia.me' : 'cliente.demo@avalia.me';
    const demoPassword = 'demoaccountpassword123';
    const demoName = role === 'prestador' ? 'Demo João Prestador' : 'Demo Maria Cliente';
    
    try {
      setStatusMsg(`Entrando como ${role === 'prestador' ? 'Prestador' : 'Cliente'} de demonstração...`);
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          setStatusMsg('Primeiro acesso da conta demo. Configurando sandbox local...');
          const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          await updateProfile(userCredential.user, {
            displayName: demoName
          });
          
          const userDocRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userDocRef, {
            uid: userCredential.user.uid,
            name: demoName,
            email: demoEmail,
            photoURL: role === 'prestador' 
              ? 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150' 
              : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            createdAt: new Date().toISOString(),
          });
          
          if (role === 'prestador') {
            const providerDocRef = doc(db, 'providers', userCredential.user.uid);
            await setDoc(providerDocRef, {
              id: userCredential.user.uid,
              name: demoName,
              title: 'Reparos Residenciais e Serviços Gerais',
              category: 'reparos',
              city: 'Curitiba',
              phone: '41999999999',
              rating: 4.9,
              reviewsCount: 18,
              description: 'Especialista em detecção de vazamentos, pequenos reparos hidráulicos, conserto de disjuntores, chuveiros, pintura e instalações elétricas corporativas. Atendimento ágil na região!',
              photo: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
              featured: true,
              plan: 'ouro',
              userId: userCredential.user.uid,
              createdAt: new Date().toISOString()
            });
          }
          navigate('/');
        } catch (createErr: any) {
          console.error("Failed demo auto-creation:", createErr);
          setErrorMsg('Falha ao configurar sandbox local: ' + createErr.message);
        }
      } else if (err.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('O login/registro com E-mail e Senha (necessário para contas de demonstração) não está ativo no Console do Firebase. Vá no Console do Firebase > Authentication > Sign-in Method > E-mail/Senha > Ativar.');
      } else if (err.code === 'auth/network-request-failed') {
        setIsNetworkError(true);
        setErrorMsg('Erro de rede (auth/network-request-failed): O Firebase rejeitou a conexão automática por segurança nas políticas do iframe. Por favor, clique no botão para abrir o app em Nova Aba no topo.');
      } else {
        console.error(err);
        setErrorMsg(err.message || 'Erro inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl"
      >
        <div className="text-center mb-8 flex flex-col items-center">
           <Logo size="lg" white={false} nameColor="text-blue-600" animated={true} />
           <h1 className="text-3xl font-black text-gray-900 mb-2 mt-6">
             {isRegister ? 'Nova Conta' : 'Que bom ver você!'}
           </h1>
           <p className="text-gray-500 leading-relaxed text-sm">
             {isRegister 
               ? 'Preencha os campos para fazer parte do Avalia-me' 
               : 'Entre para contratar e avaliar prestadores de serviço'
             }
           </p>
        </div>

        {/* Tab Selectors */}
        <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 mb-6">
          <button
            type="button"
            onClick={() => { 
              setIsRegister(false); 
              setErrorMsg(''); 
              setIsNetworkError(false); 
              setWhatsappVerified(false);
              setCodeSent(false);
              setUserInputCode('');
              setVerificationError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
              !isRegister ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { 
              setIsRegister(true); 
              setErrorMsg(''); 
              setIsNetworkError(false); 
              setWhatsappVerified(false);
              setCodeSent(false);
              setUserInputCode('');
              setVerificationError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
              isRegister ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Cadastrar-se
          </button>
        </div>

        {/* Dynamic Status messages */}
        {statusMsg && (
          <div className="mb-4 bg-blue-50 text-blue-800 border border-blue-100 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Dynamic Error Messaging with actionable Help Card inside Iframe */}
        {errorMsg && (
          <div className="mb-6 bg-red-50 text-red-800 border border-red-100 rounded-2xl p-4 text-xs font-semibold leading-relaxed">
            <div className="flex items-start gap-2 mb-2 font-black text-red-900">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-650" />
              <span>Aviso de Sistema</span>
            </div>
            <p>{errorMsg}</p>

            {(isNetworkError || errorMsg.toLowerCase().includes('network-request-failed') || errorMsg.toLowerCase().includes('popup')) && (
              <div className="mt-4 pt-4 border-t border-red-200/50 bg-red-100/30 p-3 rounded-xl space-y-3">
                <p className="font-extrabold text-red-950 text-[11px] leading-snug">
                  🛡️ <strong>Como contornar restrições de iframe do navegador:</strong>
                </p>
                <div className="space-y-2 text-[10.5px] text-red-900">
                  <p>1. <strong>Abra o App em Nova Aba:</strong> O seu navegador bloqueia a comunicação de popups externos (como Google/Facebook) se eles forem carregados dentro de um iframe embutido.</p>
                  <p>2. <strong>Login por E-mail:</strong> O fluxo de e-mail e senha abaixo não precisa de popups e funcionará instantaneamente.</p>
                  <p>3. <strong>Logins de Teste Rápido:</strong> Use os botões abaixo para logar instantaneamente sem popups.</p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <a 
                    href={window.location.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-3 rounded-xl text-center shadow transition-all hover:scale-[1.02]"
                  >
                    <span>Abrir App em Nova Aba</span>
                    <ExternalLink size={12} />
                  </a>
                  
                  {/* Shortcut to authorize domains message */}
                  <span className="text-[9.5px] text-gray-500 leading-normal text-center block pt-1">
                    Configuração técnica: Adicione o domínio <code className="font-mono bg-white border px-1 py-0.5 rounded text-gray-700">{window.location.hostname}</code> aos <strong>Domínios Autorizados</strong> no Firebase Authentication Settings.
                  </span>
                </div>
              </div>
            )}

            {isOperationNotAllowed && (
              <div className="mt-4 pt-4 border-t border-red-200/50 bg-red-100/30 p-3 rounded-xl space-y-3">
                <p className="font-extrabold text-red-950 text-[11px] leading-snug">
                  ⚙️ <strong>Como configurar no Console do Firebase:</strong>
                </p>
                <div className="space-y-2 text-[10.5px] text-red-900">
                  <p>O Firebase exige que o proprietário do projeto ative os métodos de login preferidos manualmente antes de aceitar requisições de autenticação.</p>
                  <p>1. Acesse o painel de provedores usando o botão abaixo.</p>
                  <p>2. Clique em <strong>Adicionar novo provedor</strong> (ou selecione <strong>E-mail/Senha</strong> caso já conste na lista).</p>
                  <p>3. Marque a opção <strong>Ativar (Enabled)</strong> e clique em <strong>Salvar (Save)</strong>.</p>
                  <p>4. Feito isso, recarregue esta página e poderá logar ou usar as Contas de Demonstração imediatamente!</p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <a 
                    href="https://console.firebase.google.com/project/gen-lang-client-0750385648/authentication/providers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-3 rounded-xl text-center shadow transition-all hover:scale-[1.02]"
                  >
                    <span>Ir para Configuração do Firebase Auth</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegister && (
            <>
              {/* Name field */}
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 transition-colors group-focus-within:text-blue-500" size={20} />
                <input 
                  type="text" 
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 outline-none rounded-2xl py-4 pl-12 pr-4 text-gray-805 placeholder:text-gray-400 font-medium transition-all"
                />
              </div>

              {/* Phone field */}
              <div className="space-y-3">
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 transition-colors group-focus-within:text-blue-500" size={20} />
                  <input 
                    type="tel" 
                    required
                    disabled={whatsappVerified}
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(formatPhone(e.target.value));
                      setWhatsappVerified(false);
                      setCodeSent(false);
                      setUserInputCode('');
                    }}
                    placeholder="Celular (DDD) ex: (41) 99999-9999"
                    className={`w-full border-2 outline-none rounded-2xl py-4 pl-12 pr-12 text-gray-800 placeholder:text-gray-400 font-semibold transition-all ${
                      whatsappVerified ? 'text-gray-500 bg-gray-100 border-green-200' : 'bg-gray-50 border-transparent focus:border-blue-500'
                    }`}
                  />
                  {whatsappVerified && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 text-white rounded-full p-0.5" title="WhatsApp Verificado!">
                      <CheckCircle size={16} className="text-white" fill="currentColor" />
                    </span>
                  )}
                </div>

                {/* Validation widget */}
                {phoneInput.replace(/[^\d]/g, '').length >= 10 && (
                  <div className="animate-fadeIn">
                    {!whatsappVerified ? (
                      <div className="bg-blue-50/50 border border-blue-100/80 rounded-2xl p-4 space-y-4 text-left">
                        <div className="flex gap-2 items-start text-xs text-blue-800 font-semibold leading-relaxed">
                          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <p>
                            Para evitar contas falsas e manter o sistema seguro, valide seu WhatsApp preenchendo o código que enviamos por mensagem.
                          </p>
                        </div>

                        {!codeSent ? (
                          <button
                            type="button"
                            disabled={sendingCode}
                            onClick={handleSendCode}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center"
                          >
                            {sendingCode ? "Enviando Código..." : "Gerar e Enviar Código ao WhatsApp"}
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-white border border-blue-100 rounded-xl p-3.5 space-y-2.5 text-xs text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Simulador de WhatsApp Ativo</span>
                              </div>
                              <p className="font-medium">
                                Enviamos o código fictício ao seu celular de teste. Digite-o abaixo:
                              </p>
                              <div className="flex items-center justify-between bg-blue-50 p-2.5 rounded-lg border border-blue-100/50">
                                <span className="text-[10px] font-bold text-blue-800">CÓDIGO RECEBIDO:</span>
                                <span className="text-xs font-mono font-black tracking-wider text-blue-900 bg-white px-2.5 py-1 rounded-md border border-blue-100 shadow-sm">
                                  {generatedCode}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={userInputCode}
                                onChange={(e) => {
                                  setUserInputCode(e.target.value.replace(/\D/g, ''));
                                  setVerificationError(null);
                                }}
                                placeholder="Código de 6 dígitos"
                                className="w-full sm:flex-1 bg-white border border-gray-200 rounded-xl p-3 text-center font-mono font-black text-lg tracking-widest outline-none focus:border-blue-500 focus:ring-1 ring-blue-500 transition-all text-gray-900"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyCode}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-xs font-black py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer shrink-0 text-center"
                              >
                                Validar Código
                              </button>
                            </div>

                            {verificationError && (
                              <p className="text-red-500 text-xs font-bold leading-snug">
                                ⚠️ {verificationError}
                              </p>
                            )}

                            <div className="text-center">
                              <button
                                type="button"
                                onClick={() => { setCodeSent(false); setUserInputCode(''); }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-all underline cursor-pointer"
                              >
                                Reenviar código para WhatsApp
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm select-none text-left">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                            <Check size={16} strokeWidth={3} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-green-950">WhatsApp Validado!</h4>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setWhatsappVerified(false);
                            setCodeSent(false);
                            setUserInputCode('');
                          }}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-white border border-rose-200 rounded-xl px-2.5 py-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          Alterar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Email field */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 transition-colors group-focus-within:text-blue-500" size={20} />
            <input 
              type="email" 
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Digite seu e-mail"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 outline-none rounded-2xl py-4 pl-12 pr-4 text-gray-805 placeholder:text-gray-400 font-medium transition-all"
            />
          </div>

          {/* Password field */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 transition-colors group-focus-within:text-blue-500" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder={isRegister ? "Crie uma senha forte" : "Digite sua senha"}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 outline-none rounded-2xl py-4 pl-12 pr-12 text-gray-805 placeholder:text-gray-400 font-medium transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title={showPassword ? "Ocultar senha" : "Exibir senha"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Password Strength Meter & Real-time checklist for Registrations */}
          {isRegister && passwordInput && (
            <div className="bg-gray-50 p-4 rounded-3xl text-left border border-gray-100 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span>Nível da senha:</span>
                <span className={`text-[11px] font-black ${getPasswordStrength(passwordInput).textColor}`}>
                  {getPasswordStrength(passwordInput).label}
                </span>
              </div>
              
              {/* Score indicator bar */}
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`h-full rounded-full transition-all duration-300 ${
                      step <= getPasswordStrength(passwordInput).score 
                        ? getPasswordStrength(passwordInput).color 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              
              {/* Individual requirements checklist */}
              <div className="space-y-1.5 text-[10.5px] font-bold text-gray-500 leading-normal">
                {getPasswordStrength(passwordInput).suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    {suggestion.satisfied ? (
                      <Check size={13} className="text-emerald-500 shrink-0" />
                    ) : (
                      <X size={13} className="text-red-400 shrink-0" />
                    )}
                    <span className={suggestion.satisfied ? 'text-emerald-600 font-black' : 'text-gray-400 font-semibold'}>
                      {suggestion.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repeat password field */}
          {isRegister && (
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 transition-colors group-focus-within:text-blue-500" size={20} />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Repita sua senha"
                className={`w-full bg-gray-50 border-2 outline-none rounded-2xl py-4 pl-12 pr-12 text-gray-805 placeholder:text-gray-400 font-medium transition-all ${
                  confirmPasswordInput 
                    ? passwordInput === confirmPasswordInput 
                      ? 'border-transparent focus:border-green-500' 
                      : 'border-red-300 focus:border-red-500' 
                    : 'border-transparent focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title={showConfirmPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
          >
            <LogIn size={20} />
            {isRegister ? 'Criar Minha Conta' : 'Entrar'}
          </button>
        </form>

        {/* Social Authentication Row */}
        <div className="relative my-8">
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-gray-100"></div>
           </div>
           <div className="relative flex justify-center">
             <span className="bg-white px-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">ou entre com</span>
           </div>
        </div>

        <div className="flex gap-3">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            title="Entrar com Google"
            className="flex-1 bg-gray-50 hover:bg-gray-100 py-4 rounded-2xl flex justify-center transition-all border border-gray-100 items-center hover:scale-[1.02] active:scale-[0.98] duration-200 shrink-0"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6a5.64 5.64 0 0 1-2.447 3.7l3.793 2.94c2.22-2.05 3.793-5.07 3.793-8.497z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.933-2.91l-3.793-2.94c-1.08.72-2.45 1.16-4.14 1.16-3.11 0-5.74-2.11-6.68-4.96l-3.927 3.04A11.973 11.973 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.32 14.35A7.16 7.16 0 0 1 5 12c0-.82.14-1.61.4-2.35L1.473 6.61A11.973 11.973 0 0 0 0 12c0 1.92.45 3.74 1.25 5.39l4.07-3.04z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.93 11.93 0 0 0 12 0 11.973 11.973 0 0 0 1.25 6.61l4.07 3.14C6.26 6.86 8.89 4.75 12 4.75z"
              />
            </svg>
          </button>
          
          <button 
            type="button"
            onClick={handleFacebookLogin}
            disabled={loading}
            title="Entrar com Facebook"
            className="flex-1 bg-gray-50 hover:bg-gray-100 py-4 rounded-2xl flex justify-center transition-all border border-gray-100 disabled:opacity-50 items-center hover:scale-[1.02] active:scale-[0.98] duration-200 shrink-0"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2" width="24" height="24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>

          <button 
            type="button"
            onClick={handleAppleLogin}
            disabled={loading}
            title="Entrar com Apple"
            className="flex-1 bg-gray-50 hover:bg-gray-100 py-4 rounded-2xl flex justify-center transition-all border border-gray-100 disabled:opacity-50 items-center hover:scale-[1.02] active:scale-[0.98] duration-200 shrink-0"
          >
            <svg className="w-5.4 h-5.4 text-black" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.02 2.95 1.1.09 2.23-.55 2.96-1.38z"/>
            </svg>
          </button>
        </div>


        <p className="text-center mt-8 text-gray-400 text-xs font-semibold max-w-sm mx-auto leading-relaxed">
          Ao entrar, você concorda com os Termos de Serviço e a Política de Privacidade do Avalia-me.
        </p>
      </motion.div>
    </div>
  );
}
