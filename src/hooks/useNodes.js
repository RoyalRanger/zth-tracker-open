import { useState, useCallback } from 'react'
import { signumClient, DEFAULT_NODES } from '../api/signum.js'

export function useNodes() {
  const [nodes, setNodes] = useState(signumClient.allNodes)
  const [activeIndex, setActive] = useState(signumClient.activeIndex)
  const [pings, setPings] = useState({})
  const [pinging, setPinging] = useState(false)

  const switchNode = useCallback((index) => {
    signumClient.setActiveIndex(index)
    setActive(index)
  }, [])

  const addCustomNode = useCallback((url, name) => {
    const idx = signumClient.addCustomNode(url, name)
    setNodes([...signumClient.allNodes])
    switchNode(idx)
  }, [switchNode])

  const removeCustomNode = useCallback((url) => {
    signumClient.removeCustomNode(url)
    setNodes([...signumClient.allNodes])
    if (signumClient.activeIndex >= signumClient.allNodes.length) {
      switchNode(0)
    }
  }, [switchNode])

  const pingAll = useCallback(async () => {
    setPinging(true)
    const results = {}
    await Promise.all(
      signumClient.allNodes.map(async (node, i) => {
        results[i] = await signumClient.pingNode(node.url)
      })
    )
    setPings(results)
    setPinging(false)
  }, [])

  return {
    nodes,
    activeIndex,
    pings,
    pinging,
    switchNode,
    addCustomNode,
    removeCustomNode,
    pingAll,
  }
}
