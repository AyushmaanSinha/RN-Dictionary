"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  WOTD_LIST,
  TRENDING_POOL,
  VOCAB_WORDS,
  LOCAL_WORDS,
  WordItem,
  TrendingItem,
  VocabItem
} from "@/constants/words";

// Dynamically import ThreeCanvas to bypass SSR checks (window / document / canvas dependencies)
const ThreeCanvas = dynamic(() => import("@/components/ThreeCanvas"), { ssr: false });
const Preloader = dynamic(() => import("@/components/Preloader"), { ssr: false });

export default function Home() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [searchWord, setSearchWord] = useState("");
  const [selectedLang, setSelectedLang] = useState("en");
  const [resultData, setResultData] = useState<any>(null);
  const [resultBadge, setResultBadge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);

  // Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const acDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Word of the Day (randomly chosen on load)
  const [wotd, setWotd] = useState<WordItem | null>(null);
  const [wotdImgUrl, setWotdImgUrl] = useState("https://loremflickr.com/500/500/serendipity");

  // Trending Pool (shuffled on load)
  const [trendingList, setTrendingList] = useState<TrendingItem[]>([]);

  // Vocab builder state
  const [vocabIndex, setVocabIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [vocabCardStyle, setVocabCardStyle] = useState<React.CSSProperties>({});

  // Dynamic greeting text
  const [greetingText, setGreetingText] = useState("Greetings");

  // Dictionary Lookup Cache (stored inside a ref so it survives state updates)
  const lookupCache = useRef<Record<string, any>>({});

  // Elements Refs for scrolling dock and slide clicks
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize client elements
  useEffect(() => {
    // 1. Shufflers and WOTD selection
    const randomWotd = WOTD_LIST[Math.floor(Math.random() * WOTD_LIST.length)];
    setWotd(randomWotd);
    setWotdImgUrl(`https://loremflickr.com/500/500/${randomWotd.word.toLowerCase()}`);

    const shuffledTrending = [...TRENDING_POOL].sort(() => 0.5 - Math.random()).slice(0, 8);
    setTrendingList(shuffledTrending);

    // 2. Set dynamic greeting
    const now = new Date();
    const hrs = now.getHours();
    let text = "Greetings";
    if (hrs >= 5 && hrs < 12) {
      text = "Good Morning";
    } else if (hrs >= 12 && hrs < 17) {
      text = "Good Afternoon";
    } else if (hrs >= 17 && hrs < 22) {
      text = "Good Evening";
    } else {
      text = "Good Night";
    }
    setGreetingText(text);

    // 3. Click outside dropdown handler
    function handleClickOutside(e: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    }
    document.addEventListener("click", handleClickOutside);

    // 4. Navigation dock scroll handler
    const handleScroll = () => {
      const header = document.querySelector(".main-header");
      if (!header) return;
      const scrollTop = window.scrollY;
      if (scrollTop <= 10) {
        header.classList.add("at-top");
        header.classList.remove("collapsed");
      } else {
        header.classList.remove("at-top");
        header.classList.add("collapsed");
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // run once on startup

    // 5. Split slide titles into individual character span elements for staggered stagger animations
    const splitTitlesIntoChars = () => {
      const titles = document.querySelectorAll(".slide-title");
      titles.forEach((title) => {
        const text = title.innerHTML;
        if (title.querySelector(".char")) return; // prevent duplicate formatting in react dev strictmode

        let newHTML = "";
        let delayCounter = 0;
        const parts = text.split(/(<br\s*\/?>)/i);
        parts.forEach((part) => {
          if (part.toLowerCase().startsWith("<br")) {
            newHTML += part;
          } else {
            for (let i = 0; i < part.length; i++) {
              if (part[i] === " ") {
                newHTML += " ";
              } else {
                newHTML += `<span class="char" style="transition-delay: ${delayCounter * 0.035}s">${part[i]}</span>`;
                delayCounter++;
              }
            }
          }
        });
        title.innerHTML = newHTML;
      });
    };
    splitTitlesIntoChars();

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Normalise and call API
  const getWord = async (wordToQuery: string, langToQuery = selectedLang) => {
    const keyword = (wordToQuery || "").trim().toLowerCase();
    if (!keyword) return;

    // Smooth scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });

    const cacheKey = `${langToQuery}:${keyword}`;

    // Check lookup cache first
    if (lookupCache.current[cacheKey]) {
      renderResult(lookupCache.current[cacheKey], keyword);
      return;
    }

    setIsLoading(true);
    setIsSearched(true);
    setResultData(null);

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/${langToQuery}/${encodeURIComponent(keyword)}`
      );
      if (response.status === 200) {
        const data = await response.json();
        lookupCache.current[cacheKey] = data;
        renderResult(data, keyword);
      } else {
        renderResult(null, keyword);
      }
    } catch (err) {
      console.error(err);
      setResultBadge("Error");
      setResultData({
        isError: true,
        word: keyword,
        meanings: [
          {
            partOfSpeech: "Error",
            definitions: [{ definition: "Failed to fetch definition. Please check your connection." }]
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = (data: any, keyword: string) => {
    setIsSearched(true);
    if (data && data.length > 0) {
      const wordData = data[0];
      setResultData(wordData);

      // Get primary part of speech
      let primaryType = "Word";
      if (wordData.meanings && wordData.meanings.length > 0) {
        primaryType = wordData.meanings[0].partOfSpeech || "Word";
      }
      setResultBadge(primaryType);

      // Update Word of the Day image to match searched word
      setWotdImgUrl(`https://loremflickr.com/500/500/${keyword}`);
    } else {
      setResultBadge("Not Found");
      setResultData({
        isNotFound: true,
        word: keyword,
        meanings: [
          {
            partOfSpeech: "Not Found",
            definitions: [{ definition: "Word not found in the dictionary." }]
          }
        ]
      });
    }
  };

  // Autocomplete change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchWord(value);

    if (acDebounceTimer.current) clearTimeout(acDebounceTimer.current);

    const query = value.trim().toLowerCase();
    if (query.length < 2) {
      setSuggestions([]);
      setIsDropdownVisible(false);
      return;
    }

    // Local matches
    const localMatches = LOCAL_WORDS.filter((w) => w.toLowerCase().startsWith(query)).slice(0, 4);
    setSuggestions(localMatches);
    setIsDropdownVisible(localMatches.length > 0);

    // Debounced Datamuse fetch
    acDebounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}&max=8`);
        if (response.ok) {
          const data = await response.json();
          const apiWords = data.map((d: any) => d.word);
          const merged = Array.from(new Set([...localMatches, ...apiWords])).slice(0, 8);
          setSuggestions(merged);
          setIsDropdownVisible(merged.length > 0);
        }
      } catch (err) {
        // Keep local matches on failure
      }
    }, 200);
  };

  const handleSuggestionClick = (word: string) => {
    setSearchWord(word);
    setIsDropdownVisible(false);
    getWord(word);
  };

  // Keyboard trigger
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      getWord(searchWord);
      setIsDropdownVisible(false);
    }
  };

  // Search card helper
  const triggerSearch = (word: string) => {
    setSearchWord(word);
    getWord(word);
  };

  // MP3 Audio pronunciation playback
  const playAudio = (wordData: any) => {
    let audioUrl = "";
    if (wordData.phonetics && wordData.phonetics.length > 0) {
      for (const p of wordData.phonetics) {
        if (p.audio) {
          audioUrl = p.audio;
          break;
        }
      }
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speakFallback(wordData.word));
    } else {
      speakFallback(wordData.word);
    }
  };

  const speakFallback = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Slide Dock Scrolling Navigation
  const scrollToSlide = (index: number) => {
    const targetScrolls = [0.0, 0.34, 0.62, 0.94];
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = maxScroll * targetScrolls[index];
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  // Vocab builder flashcard animations
  const cycleVocabWord = () => {
    setIsCardFlipped(false);
    setVocabCardStyle({
      transition: "transform 0.25s ease-in, opacity 0.25s ease-in",
      transform: isCardFlipped ? "rotateY(180deg) translateX(-150%)" : "translateX(-150%)",
      opacity: 0
    });

    setTimeout(() => {
      setVocabIndex((prev) => (prev + 1) % VOCAB_WORDS.length);
      setVocabCardStyle({
        transition: "none",
        transform: "translateX(150%)",
        opacity: 0
      });

      // Force reflow
      setTimeout(() => {
        setVocabCardStyle({
          transition: "transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 0.35s ease-out",
          transform: "translateX(0)",
          opacity: 1
        });
      }, 50);
    }, 250);
  };

  const currentVocab: VocabItem = VOCAB_WORDS[vocabIndex];

  return (
    <>
      {/* 3D WebGL Background Render */}
      <ThreeCanvas />

      {/* Greeting preloader overlay */}
      {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} />}

      {/* Custom Cursor Overlay */}
      <div className="cursor-inner"></div>
      <div className="cursor-outer"></div>

      {/* Decorative Grid Overlays */}
      <div className="grid-horizontal-line"></div>
      <div className="grid-lines">
        <div className="grid-line">
          <div className="grid-dot top"></div>
          <div className="grid-dot bottom"></div>
        </div>
        <div className="grid-line">
          <div className="grid-dot top"></div>
          <div className="grid-dot bottom"></div>
        </div>
        <div className="grid-line">
          <div className="grid-dot top"></div>
          <div className="grid-dot bottom"></div>
        </div>
        <div className="grid-line">
          <div className="grid-dot top"></div>
          <div className="grid-dot bottom"></div>
          <div className="story-dashes">
            <div className="story-dash">
              <div className="story-dash-fill" id="dash-fill-1"></div>
            </div>
            <div className="story-dash">
              <div className="story-dash-fill" id="dash-fill-2"></div>
            </div>
            <div className="story-dash">
              <div className="story-dash-fill" id="dash-fill-3"></div>
            </div>
            <div className="story-dash">
              <div className="story-dash-fill" id="dash-fill-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Navbar Dock & Viewport Elements Container */}
      <div className="cinematic-container">
        <header className="main-header at-top">
          <div className="brand" style={{ opacity: showPreloader ? 0 : 1 }}>
            POCKET<span>DICTIONARY</span>
          </div>
          <nav className="header-nav">
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSlide(0); }}>
              Search
            </a>
            <span className="nav-dot"></span>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSlide(1); }}>
              WOTD
            </a>
            <span className="nav-dot"></span>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSlide(2); }}>
              Trending
            </a>
            <span className="nav-dot"></span>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSlide(3); }}>
              Vocab
            </a>
          </nav>
          <div className="header-actions" style={{ opacity: showPreloader ? 0 : 1 }}>
            <a href="#" className="contact-btn" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              {greetingText} <span className="btn-circle"></span>
            </a>
          </div>
        </header>

        {/* Slide 1: Left-Aligned Search with Dropdown and API definitions */}
        <section className="slide" id="slide-1">
          <div className="desc-row">
            <div className="col-1">
              <h1 className="slide-title">
                Bronze <br />
                and Time
              </h1>
              <p className="slide-subtitle-text">
                A cinematic 3D search experience. Type a word below to query the dictionary API and retrieve instant phonetic audio and definitions.
              </p>

              <div className="search-row">
                <div className="search-box-wrapper">
                  <input
                    type="text"
                    ref={inputRef}
                    value={searchWord}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="search-input"
                    placeholder="Type a word to search..."
                    autoComplete="off"
                  />
                  {isDropdownVisible && (
                    <div className="autocomplete-dropdown visible" ref={dropdownRef}>
                      {suggestions.map((word) => {
                        const query = searchWord.trim().toLowerCase();
                        const highlightEnd = query.length;
                        const hasPrefix = word.toLowerCase().startsWith(query);
                        return (
                          <div
                            key={word}
                            className="autocomplete-item"
                            onClick={() => handleSuggestionClick(word)}
                          >
                            {hasPrefix ? (
                              <>
                                <span className="ac-match">{word.substring(0, highlightEnd)}</span>
                                {word.substring(highlightEnd)}
                              </>
                            ) : (
                              word
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <select
                  value={selectedLang}
                  onChange={(e) => {
                    setSelectedLang(e.target.value);
                    getWord(searchWord, e.target.value);
                  }}
                  className="lang-select"
                  title="Language"
                >
                  <option value="en">EN</option>
                  <option value="es">ES</option>
                  <option value="fr">FR</option>
                  <option value="de">DE</option>
                  <option value="it">IT</option>
                  <option value="pt-BR">PT</option>
                  <option value="ar">AR</option>
                  <option value="ja">JA</option>
                  <option value="ko">KO</option>
                  <option value="hi">HI</option>
                  <option value="tr">TR</option>
                  <option value="ru">RU</option>
                </select>

                <button className="search-submit-btn" onClick={() => getWord(searchWord)}>
                  Search
                </button>
              </div>

              {isLoading && (
                <div className="dic-loader" style={{ display: "block" }}>
                  <span className="pulse-loader"></span> Searching definition...
                </div>
              )}

              {isSearched && resultData && (
                <div className="dic-result-card active">
                  <div className="result-word-header">
                    <span className="result-word">{resultData.word || searchWord}</span>
                    <span className="result-type-badge">{resultBadge}</span>
                  </div>
                  <div className="result-definition-section">
                    {resultData.phonetic && <p className="result-phonetic">{resultData.phonetic}</p>}

                    {resultData.meanings &&
                      resultData.meanings.map((meaning: any, mIdx: number) => (
                        <div key={mIdx} className="meaning-block">
                          <div className="result-def-label">{meaning.partOfSpeech}</div>
                          {meaning.definitions &&
                            meaning.definitions.slice(0, 3).map((def: any, dIdx: number) => (
                              <p key={dIdx} className="result-definition">
                                {dIdx + 1}. {def.definition}
                              </p>
                            ))}
                        </div>
                      ))}

                    {!resultData.isNotFound && !resultData.isError && (
                      <div style={{ marginTop: "10px" }}>
                        <button className="listen-btn" onClick={() => playAudio(resultData)}>
                          <ion-icon name="volume-medium-sharp" style={{ fontSize: "15px" }}></ion-icon> Listen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Slide 2: Word of the Day */}
        <div className="slide-image-mask" id="slide-2-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wotdImgUrl} alt="Featured Word Image" />
        </div>
        <section className="slide" id="slide-2">
          <h2 className="slide-title">
            Word <br />
            of the Day
          </h2>
          {wotd && (
            <div className="slide-desc wotd-clickable-card" onClick={() => triggerSearch(wotd.word)}>
              <div className="wotd-card-label">CLICK TO LOOK UP</div>
              <div className="wotd-card-header">
                <span className="wotd-card-word">{wotd.word}</span>
                <span className="wotd-badge">{wotd.type}</span>
              </div>
              <p className="wotd-card-desc">{wotd.definition}</p>
              <div className="wotd-example">&quot;{wotd.example}&quot;</div>
            </div>
          )}
        </section>

        {/* Slide 3: Trending Capsules */}
        <section className="slide" id="slide-3">
          <h2 className="slide-title">Trending</h2>
          <div className="slide-desc trending-grid-section">
            <div className="slide-desc-text">Select a word capsule below to explore its essence and definition.</div>
            <div className="trending-capsules-container">
              {trendingList.map((item, idx) => {
                const numStr = String(idx + 1).padStart(2, "0");
                return (
                  <div key={item.word} className="art-capsule" onClick={() => triggerSearch(item.word)}>
                    <span className="capsule-num">{numStr}</span>
                    <div className="capsule-divider"></div>
                    <div className="capsule-body">
                      <div className="capsule-word-group">
                        <span className="capsule-word">{item.word}</span>
                        <span className="capsule-desc">{item.poeticDesc}</span>
                      </div>
                      <div className="capsule-badge-group">
                        <span className="capsule-badge">{item.type}</span>
                        <span className="capsule-arrow">
                          <ion-icon name="arrow-forward-outline"></ion-icon>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Slide 4: Vocab Builder Flip Cards */}
        <section className="slide" id="slide-4">
          <h2 className="slide-title">
            Vocab <br />
            Builder
          </h2>
          <div className="slide-desc vocab-card-wrapper">
            <div
              className={`vocab-card ${isCardFlipped ? "flipped" : ""}`}
              id="flip-card"
              style={vocabCardStyle}
              onClick={() => setIsCardFlipped((prev) => !prev)}
            >
              <div className="vocab-card-inner">
                {/* Front Card Face */}
                <div className="vocab-card-front">
                  <ion-icon name={currentVocab.icon} class="vocab-front-icon"></ion-icon>
                  <span className="vocab-word">{currentVocab.word}</span>
                  <span className="tap-hint">Tap to flip card</span>
                </div>

                {/* Back Card Face */}
                <div className="vocab-card-back">
                  <div className="vocab-back-header">
                    <span className="vocab-word-back">{currentVocab.word}</span>
                    <span className="vocab-badge-back">{currentVocab.type}</span>
                  </div>
                  <p className="vocab-def-back">{currentVocab.definition}</p>
                  <p className="vocab-ex-back">&quot;{currentVocab.example}&quot;</p>
                  <span className="tap-hint" style={{ color: "rgba(183, 180, 174, 0.5)" }}>
                    Tap to show front
                  </span>
                </div>
              </div>
            </div>
            <button className="vocab-next-btn" onClick={cycleVocabWord}>
              Next Word <span style={{ fontSize: "14px" }}>&#8594;</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
