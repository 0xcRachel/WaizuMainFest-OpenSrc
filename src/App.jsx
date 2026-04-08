import './App.css'
import { useState, useEffect, useRef } from 'react'

const App = () => {
  // State cho game search
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  // State cho game details
  const [steamAppId, setSteamAppId] = useState('')
  const [gameDetails, setGameDetails] = useState(null)
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  
  // State cho manifest
  const [branchInfo, setBranchInfo] = useState(null)
  const [isCheckingManifest, setIsCheckingManifest] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // State chung
  const [statusMessage, setStatusMessage] = useState('')
  const [allBranches, setAllBranches] = useState([])
  
  const searchTimeout = useRef(null)
  const searchRef = useRef(null)
  const isSelectingRef = useRef(false)

  // Proxy CORS cho Steam API
  const fetchWithProxy = async (url) => {
    const proxies = [
      'API HERE'
    ]
    
    for (const proxy of proxies) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        const response = await fetch(proxy + encodeURIComponent(url), { signal: controller.signal })
        clearTimeout(timeoutId)
        if (response.ok) return await response.json()
      } catch (e) {
        console.warn(`Proxy failed:`, e)
      }
    }
    throw new Error('All proxies failed')
  }

  // Hàm xử lý HTML trong requirements
  const parseHtmlRequirements = (html) => {
    if (!html) return 'No requirements specified'
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong>/gi, '')
      .replace(/<\/strong>/gi, '')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim()
  }

  // Tìm kiếm game - gọi khi nhấn Enter
  const searchGames = async (query) => {
    if (!query || query.length < 2) {
      setStatusMessage('Please enter at least 2 characters to search')
      return
    }
    
    if (isSelectingRef.current || isLoadingGame) return
    
    setIsSearching(true)
    setSuggestions([])
    setShowSuggestions(false)
    setStatusMessage('Searching for games...')
    
    try {
      const targetUrl = ``
      const data = await fetchWithProxy(targetUrl)
      
      if (data && data.items && data.items.length > 0) {
        setSuggestions(data.items)
        setShowSuggestions(true)
        setStatusMessage(`Found ${data.items.length} games. Click to select.`)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
        setStatusMessage(`No games found for "${query}"`)
        setTimeout(() => setStatusMessage(''), 3000)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSuggestions([])
      setShowSuggestions(false)
      setStatusMessage('Search failed. Please try again.')
      setTimeout(() => setStatusMessage(''), 3000)
    } finally {
      setIsSearching(false)
    }
  }

  // Xử lý khi nhấn Enter trên input search
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchGames(searchQuery)
    }
  }

  // Click outside để đóng suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Lấy thông tin chi tiết game từ Steam
  const fetchGameDetails = async (appId, gameName = '') => {
    if (!appId) return
    
    isSelectingRef.current = true
    setShowSuggestions(false)
    setSuggestions([])
    setIsLoadingGame(true)
    setGameDetails(null)
    setBranchInfo(null)
    setStatusMessage('Fetching game details...')
    
    try {
      const targetUrl = ``
      const data = await fetchWithProxy(targetUrl)
      
      if (data && data[appId] && data[appId].success) {
        const game = data[appId].data
        setGameDetails(game)
        setSteamAppId(appId)
        setStatusMessage(`Loaded: ${game.name}`)
        await checkManifestExists(appId)
      } else {
        setStatusMessage(`Game not found with ID: ${appId}`)
        setGameDetails(null)
      }
    } catch (error) {
      console.error('Error fetching game details:', error)
      setStatusMessage('Error fetching game details. Please try again.')
      setGameDetails(null)
    } finally {
      setIsLoadingGame(false)
      setTimeout(() => {
        isSelectingRef.current = false
      }, 500)
    }
  }

  // Kiểm tra manifest từ ManifestHub2
  const checkManifestExists = async (appId) => {
    if (!appId) return
    
    setIsCheckingManifest(true)
    setBranchInfo(null)
    
    try {
      const branchResponse = await fetch(``)
      
      if (branchResponse.ok) {
        const branchData = await branchResponse.json()
        setBranchInfo({
          exists: true,
          name: branchData.name,
          commit: branchData.commit.sha,
        })
        setStatusMessage(`Found manifest for ${gameDetails?.name || appId}! Ready to download.`)
      } else {
        let branches = allBranches
        if (branches.length === 0) {
          const listResponse = await fetch('')
          if (listResponse.ok) {
            branches = await listResponse.json()
            setAllBranches(branches)
          }
        }
        
        setBranchInfo({
          exists: false,
          name: null,
          availableBranches: branches.map(b => b.name)
        })
        setStatusMessage(`No manifest found for App ID ${appId}`)
      }
    } catch (error) {
      console.error('Error checking manifest:', error)
      setBranchInfo({ exists: false, name: null, error: true })
      setStatusMessage('Error checking manifest. Please try again.')
    } finally {
      setIsCheckingManifest(false)
    }
  }

  // Chọn game từ suggestion
  const selectGame = (game) => {
    setSearchQuery(game.name)
    setShowSuggestions(false)
    setSuggestions([])
    fetchGameDetails(game.id, game.name)
  }

  // Tải manifest
  const downloadManifest = () => {
    if (!branchInfo?.exists) {
      setStatusMessage('Cannot download: No manifest found for this App ID.')
      return
    }
    
    setIsDownloading(true)
    const downloadUrl = `API HERE`
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `Manifest_${steamAppId}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setStatusMessage(`Downloading manifest for ${gameDetails?.name || steamAppId}...`)
    
    setTimeout(() => {
      setIsDownloading(false)
      setStatusMessage(`Download complete! (App ID: ${steamAppId})`)
      setTimeout(() => setStatusMessage(''), 3000)
    }, 2000)
  }

  return (
    <div className="steam-dashboard">
      {/* Ảnh absolute nằm trên cùng */}
      <div className="dashboard-bg-image">
        <img src="/img/image.png" alt="background" />
      </div>
      
      <div className="dashboard-header">
        <div className="admin-title">
          <h1>0xcRachel - WaizuMainFest</h1>
          <div className="admin-badge">application for free</div>
          <div className="admin-badge">fl me in github 0xcRachel</div>
        </div>
        <div className="header-right">
          WaizuMainFest
        </div>
      </div>

      <div className="dashboard-main">
        {/* Search Section */}
        <div className="search-section" ref={searchRef}>
          <div className="input-group">
            <div className="input-label">SEARCH GAME NAME (Press Enter)</div>
            <div className="search-input-wrapper">
              <input 
                type="text" 
                className="modern-input" 
                placeholder="e.g., Counter-Strike 2, Dota 2..." 
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
            </div>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && !isLoadingGame && !isSelectingRef.current && suggestions.length > 0 && (
              <div className="search-results-dropdown">
                {suggestions.map((game, index) => (
                  <div 
                    key={game.id || index}
                    className="search-item"
                    onClick={() => selectGame(game)}
                  >
                    {game.tiny_image && (
                      <img 
                        src={game.tiny_image} 
                        alt={game.name}
                        className="search-item-image"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div className="search-item-info">
                      <span className="search-item-name">{game.name}</span>
                      <span className="search-item-id">ID: {game.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* App ID Row */}
        <div className="appid-row">
          <div className="input-group appid-field">
            <div className="input-label">STEAM APP ID</div>
            <input 
              type="number" 
              className="modern-input" 
              placeholder="Auto-filled when selecting game" 
              value={steamAppId}
              readOnly
            />
          </div>
        </div>
        
        <div className="helper-note">
          {isSearching ? 'Searching...' : isLoadingGame || isCheckingManifest ? 'Loading...' : 'Type game name and press Enter to search'}
        </div>

        {/* Game Preview Row */}
        <div className="game-preview-row">
          <div className="game-image">
            {isLoadingGame ? (
              <div className="game-image-placeholder">LOADING IMAGE...</div>
            ) : gameDetails?.header_image ? (
              <img 
                src={gameDetails.header_image} 
                alt={gameDetails.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div className="game-image-placeholder">GAME IMAGE</div>
            )}
          </div>
          
          <div className="manifest-info">
            <div className="manifest-header">
              <span>GAME & MANIFEST INFO</span>
            </div>
            <div className="preview-placeholder">
              {isLoadingGame ? (
                'Loading game details...'
              ) : gameDetails ? (
                <div>
                  <p><strong>{gameDetails.name}</strong></p>
                  <p><small>{gameDetails.short_description?.substring(0, 150)}...</small></p>
                  <p>Developer: {gameDetails.developers?.join(', ') || 'N/A'}</p>
                  <p>Release Date: {gameDetails.release_date?.date || 'N/A'}</p>
                  {gameDetails.pc_requirements?.minimum && (
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#5e6f8d', marginTop: '10px', fontSize: '0.75rem' }}>Minimum Requirements</summary>
                      <pre style={{ 
                        fontSize: '0.7rem', 
                        marginTop: '8px', 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        background: '#f8fafc',
                        padding: '10px',
                        borderRadius: '12px',
                        lineHeight: '1.5'
                      }}>
                        {parseHtmlRequirements(
                          typeof gameDetails.pc_requirements.minimum === 'string' 
                            ? gameDetails.pc_requirements.minimum 
                            : JSON.stringify(gameDetails.pc_requirements.minimum, null, 2)
                        )}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                'Select a game to view details'
              )}
            </div>
          </div>
        </div>

        {/* Manifest Status */}
        {branchInfo && !isLoadingGame && !isCheckingManifest && (
          <div className={`manifest-status-box ${branchInfo.exists ? 'success' : 'error'}`}>
            {branchInfo.exists ? (
              <div>
                <p><strong>✓ ID SteamDB info:</strong> <code>{branchInfo.name}</code></p>
                <p><strong>Update lasted commit:</strong> <code>{branchInfo.commit?.slice(0, 7)}</code></p>
                <p><strong>Repository:</strong> <code>0xcRachel Made Toolkit</code></p>
              </div>
            ) : (
              <>
                <strong>✗ No manifest found for App ID {steamAppId}</strong>
                {branchInfo.availableBranches && branchInfo.availableBranches.length > 0 && (
                  <details>
                    <summary>View available App IDs ({branchInfo.availableBranches.length} branches)</summary>
                    <div className="branches-list">
                      {branchInfo.availableBranches.slice(0, 20).map(branchName => (
                        <span 
                          key={branchName} 
                          className="branch-tag"
                          onClick={() => fetchGameDetails(branchName)}
                        >
                          {branchName}
                        </span>
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        )}

        {/* Download Button */}
        {/* {branchInfo?.exists && !isLoadingGame && !isCheckingManifest && (
          <div className="download-action">
            <button 
              className="btn-download" 
              onClick={downloadManifest}
              disabled={isDownloading}
            >
              {isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD MANIFEST'}
            </button>
          </div>
        )}
         */}
        {/* Status Message */}
        <div className="status-message">
          {statusMessage && (
            <div className={`status-alert ${
              statusMessage.includes('Found') || statusMessage.includes('complete') ? 'success' : 
              statusMessage.includes('Error') || statusMessage.includes('No') || statusMessage.includes('not found') ? 'error' : 'info'
            }`}>
              {statusMessage}
            </div>
          )}
        </div>

        {branchInfo?.exists && !isLoadingGame && !isCheckingManifest && (
          <div className="download-action">
            <button 
              className="btn-download" 
              onClick={downloadManifest}
              disabled={isDownloading}
            >
              {isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD MANIFEST'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App