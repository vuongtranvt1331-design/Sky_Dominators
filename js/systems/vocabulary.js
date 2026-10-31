/* js/systems/vocabulary.js — ordered classic script; entrypoints declare dependency order. */
class VocabService {
    constructor() {
        this.dbName = "LexicalSpaceDB";
        this.storeName = "words";
        this.vocabularyList = [];
        this.allDistractorPool = [];
        this.activeUser = "";
        this.isLoaded = false;
        this.sourceName = "BUILT-IN IELTS DECK";
        this.drawDeck = [];
        this.playedHistory = [];
    }

    normalize(text) {
        return (text || "").toString().trim().toLowerCase();
    }

    resetExhaustionDeck(excludeWord = "") {
        const pool = this.vocabularyList.slice();
        // Fisher-Yates shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        // Avoid starting new cycle with the same word just played
        if (pool.length > 1 && pool[pool.length - 1].word === excludeWord) {
            const swapIdx = Math.floor(Math.random() * (pool.length - 1));
            [pool[pool.length - 1], pool[swapIdx]] = [pool[swapIdx], pool[pool.length - 1]];
        }
        this.drawDeck = pool;
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.activeUser = urlParams.get('user') || localStorage.getItem('vocab_user') || "";
        const modeParam = urlParams.get('mode') || "";
        const topicParam = urlParams.get('topic') || "";

        // Update Topic Display Badge in bottom status bar
        const activeTopicBadge = document.getElementById('activeTopicBadge');
        if (activeTopicBadge) {
            if (modeParam === "topic" && topicParam) {
                activeTopicBadge.textContent = `TOPIC: ${topicParam.toUpperCase()}`;
            } else {
                activeTopicBadge.textContent = "TOPIC: ALL";
            }
        }

        // 1. Immediately activate built-in IELTS vocabulary as baseline so game NEVER blocks or fails
        this.vocabularyList = BUILTIN_IELTS_VOCABULARY.map(d => ({
            word: d.word,
            synonyms: [...d.synonyms],
            meaning: d.meaning,
            topic: d.topic || "Academic IELTS",
            memoryStatus: d.memoryStatus || 'not_remembered'
        }));
        this.sourceName = `BUILT-IN IELTS DECK (${this.vocabularyList.length} WORDS)`;
        this.resetExhaustionDeck();
        this.rebuildDistractorPool();
        this.isLoaded = true;

        const dot = document.getElementById('idbStatusDot');
        const text = document.getElementById('idbStatusText');
        if (dot) {
            dot.style.background = '#10b981';
            dot.style.boxShadow = '0 0 8px #10b981';
        }
        if (text) {
            text.textContent = `VOCABULARY READY (${this.vocabularyList.length} IELTS WORDS)`;
        }

        // 2. Shared IndexedDB Query (LexicalSpaceDB v1) with safety timeout
        try {
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('TIMEOUT'), 1200));
            const idbPromise = this.fetchFromIndexedDB(this.activeUser, modeParam === 'topic' ? topicParam : "");
            const idbResult = await Promise.race([idbPromise, timeoutPromise]);

            if (Array.isArray(idbResult) && idbResult.length > 0) {
                this.vocabularyList = idbResult;
                this.sourceName = `INDEXEDDB (${this.vocabularyList.length} WORDS)`;
                this.resetExhaustionDeck();
                this.rebuildDistractorPool();
                if (dot) {
                    dot.style.background = '#10b981';
                    dot.style.boxShadow = '0 0 8px #10b981';
                }
                if (text) text.textContent = `IDB: ${idbResult.length} WORDS LOADED`;
            } else if (Array.isArray(idbResult) && idbResult.length === 0) {
                if (dot) {
                    dot.style.background = '#f59e0b';
                    dot.style.boxShadow = '0 0 8px #f59e0b';
                }
                if (text) text.textContent = `IDB EMPTY - USING BASELINE DECK`;
            } else {
                if (dot) {
                    dot.style.background = '#f59e0b';
                    dot.style.boxShadow = '0 0 8px #f59e0b';
                }
                if (text) text.textContent = `IDB READY - BASELINE DECK`;
            }
        } catch (e) {
            if (dot) {
                dot.style.background = '#ef4444';
                dot.style.boxShadow = '0 0 8px #ef4444';
            }
            if (text) text.textContent = `IDB UNAVAILABLE - OFFLINE BASELINE`;
        }

        const badge = document.getElementById('deckBadge');
        if (badge) badge.textContent = `${this.vocabularyList.length} Active Words (${this.sourceName})`;
    }

    rebuildDistractorPool() {
        const poolSet = new Set();
        for (const item of this.vocabularyList) {
            for (const syn of item.synonyms) {
                const s = syn.trim();
                if (s.length > 0) poolSet.add(s);
            }
        }
        for (const item of BUILTIN_IELTS_VOCABULARY) {
            for (const syn of item.synonyms) {
                poolSet.add(syn.trim());
            }
        }
        this.allDistractorPool = Array.from(poolSet);
    }

    fetchFromIndexedDB(username, targetTopic = "") {
        return new Promise((resolve) => {
            if (!window.indexedDB) return resolve(null);
            const req = indexedDB.open(this.dbName, 1);
            req.onerror = () => resolve(null);
            req.onsuccess = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.close();
                    return resolve(null);
                }
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const getAllReq = store.getAll();

                getAllReq.onerror = () => { db.close(); resolve(null); };
                getAllReq.onsuccess = () => {
                    const rawRecords = getAllReq.result || [];
                    db.close();

                    const userNorm = this.normalize(username);
                    const topicNorm = this.normalize(targetTopic);
                    const validRecords = [];

                    for (const rec of rawRecords) {
                        if (!rec || !rec.word) continue;
                        const recUser = this.normalize(rec.username);
                        if (userNorm && recUser && recUser !== userNorm) continue;
                        if (topicNorm) {
                            const recTopic = this.normalize(rec.topic);
                            if (recTopic && recTopic !== topicNorm) continue;
                        }

                        const wordStr = rec.word.trim();
                        const synSet = new Set();
                        const wordNorm = this.normalize(wordStr);

                        [rec.synonym1, rec.synonym2].forEach(s => {
                            if (s && typeof s === 'string') {
                                const clean = s.trim();
                                if (clean.length > 0 && this.normalize(clean) !== wordNorm) {
                                    synSet.add(clean);
                                }
                            }
                        });

                        if (Array.isArray(rec.synonyms)) {
                            rec.synonyms.forEach(s => {
                                if (s && typeof s === 'string') {
                                    const clean = s.trim();
                                    if (clean.length > 0 && this.normalize(clean) !== wordNorm) {
                                        synSet.add(clean);
                                    }
                                }
                            });
                        } else if (typeof rec.synonyms === 'string' && rec.synonyms.trim()) {
                            rec.synonyms.split(',').forEach(s => {
                                const clean = s.trim();
                                if (clean.length > 0 && this.normalize(clean) !== wordNorm) synSet.add(clean);
                            });
                        }

                        if (synSet.size > 0) {
                            validRecords.push({
                                word: wordStr,
                                synonyms: Array.from(synSet),
                                meaning: rec.meaning || "",
                                topic: rec.topic || "General",
                                memoryStatus: rec.memoryStatus || 'not_remembered',
                                hasBeenStudied: !!rec.hasBeenStudied
                            });
                        }
                    }

                    // If specific topic had no matches, attempt all topics for user
                    if (validRecords.length === 0 && topicNorm) {
                        for (const rec of rawRecords) {
                            if (!rec || !rec.word) continue;
                            const recUser = this.normalize(rec.username);
                            if (userNorm && recUser && recUser !== userNorm) continue;

                            const wordStr = rec.word.trim();
                            const synSet = new Set();
                            const wordNorm = this.normalize(wordStr);
                            [rec.synonym1, rec.synonym2].forEach(s => {
                                if (s && typeof s === 'string') {
                                    const clean = s.trim();
                                    if (clean.length > 0 && this.normalize(clean) !== wordNorm) synSet.add(clean);
                                }
                            });
                            if (Array.isArray(rec.synonyms)) {
                                rec.synonyms.forEach(s => {
                                    if (s && typeof s === 'string') {
                                        const clean = s.trim();
                                        if (clean.length > 0 && this.normalize(clean) !== wordNorm) synSet.add(clean);
                                    }
                                });
                            } else if (typeof rec.synonyms === 'string' && rec.synonyms.trim()) {
                                rec.synonyms.split(',').forEach(s => {
                                    const clean = s.trim();
                                    if (clean.length > 0 && this.normalize(clean) !== wordNorm) synSet.add(clean);
                                });
                            }
                            if (synSet.size > 0) {
                                validRecords.push({
                                    word: wordStr,
                                    synonyms: Array.from(synSet),
                                    meaning: rec.meaning || "",
                                    topic: rec.topic || "General",
                                    memoryStatus: rec.memoryStatus || 'not_remembered',
                                    hasBeenStudied: !!rec.hasBeenStudied
                                });
                            }
                        }
                    }

                    resolve(validRecords.length > 0 ? validRecords : null);
                };
            };
        });
    }

    isValidVocabEntry(entry) {
        if (!entry || typeof entry.word !== 'string') return false;
        const w = this.normalize(entry.word);
        if (!w) return false;
        if (!Array.isArray(entry.synonyms) || entry.synonyms.length === 0) return false;
        const validSyns = entry.synonyms
            .map(s => this.normalize(s))
            .filter(s => s && s !== w);
        return validSyns.length > 0;
    }

    getRandomWord(excludeWords = "") {
        const excludeSet = new Set();
        if (typeof excludeWords === 'string' && excludeWords) {
            excludeSet.add(this.normalize(excludeWords));
        } else if (Array.isArray(excludeWords)) {
            excludeWords.forEach(w => {
                if (w) excludeSet.add(this.normalize(w));
            });
        } else if (excludeWords instanceof Set) {
            excludeWords.forEach(w => {
                if (w) excludeSet.add(this.normalize(w));
            });
        }

        if (!this.drawDeck || this.drawDeck.length === 0) {
            this.resetExhaustionDeck();
        }

        let chosen = null;
        let attempts = this.drawDeck.length;
        while (attempts > 0 && this.drawDeck.length > 0) {
            attempts--;
            const cand = this.drawDeck.pop();
            if (cand && this.isValidVocabEntry(cand) && !excludeSet.has(this.normalize(cand.word))) {
                chosen = cand;
                break;
            } else if (cand && this.isValidVocabEntry(cand)) {
                this.drawDeck.unshift(cand);
            }
        }

        if (!chosen) {
            for (const item of this.vocabularyList) {
                if (this.isValidVocabEntry(item) && !excludeSet.has(this.normalize(item.word))) {
                    chosen = item;
                    break;
                }
            }
        }

        if (!chosen) {
            for (const item of BUILTIN_IELTS_VOCABULARY) {
                if (this.isValidVocabEntry(item) && !excludeSet.has(this.normalize(item.word))) {
                    chosen = item;
                    break;
                }
            }
        }

        if (!chosen) {
            chosen = BUILTIN_IELTS_VOCABULARY[0];
        }

        this.playedHistory.push(chosen.word);
        return chosen;
    }

    getDifficultWord(excludeWords = "") {
        return this.getRandomWord(excludeWords);
    }
}

const vocabService = new VocabService();

window.vocabService = vocabService;
